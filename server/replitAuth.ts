import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  // Store login mode in session to check in callback
  const createVerifyFunction = (loginOnly: boolean): VerifyFunction => {
    return async (
      tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
      verified: passport.AuthenticateCallback
    ) => {
      const claims = tokens.claims();
      if (!claims) {
        return verified(new Error("NO_CLAIMS"), undefined);
      }
      const userId = claims["sub"];
      
      // Check if user already exists in OUR database BEFORE upserting
      const existingUser = await storage.getUser(userId);
      
      if (loginOnly && !existingUser) {
        // Login-only mode but user doesn't exist in our database - reject
        // Don't call upsertUser to prevent account creation
        return verified(new Error("USER_NOT_FOUND"), undefined);
      }
      
      // Allow signup or existing user login - now create/update user in our database
      const user = {};
      updateUserSession(user, tokens);
      await upsertUser(claims);
      verified(null, user);
    };
  };

  const registeredStrategies = new Set<string>();
  const registeredLoginOnlyStrategies = new Set<string>();

  const ensureStrategy = (domain: string, loginOnly: boolean = false) => {
    const strategyName = loginOnly 
      ? `replitauth-loginonly:${domain}` 
      : `replitauth:${domain}`;
    const strategiesSet = loginOnly ? registeredLoginOnlyStrategies : registeredStrategies;
    
    if (!strategiesSet.has(strategyName)) {
      const callbackPath = loginOnly ? "/api/callback-login" : "/api/callback";
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}${callbackPath}`,
        },
        createVerifyFunction(loginOnly),
      );
      passport.use(strategy);
      strategiesSet.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Login route - only for existing users (from landing page Login button)
  app.get("/api/login", (req, res, next) => {
    if (req.isAuthenticated()) {
      const user = req.user as any;
      const now = Math.floor(Date.now() / 1000);
      if (user.expires_at && now <= user.expires_at) {
        return res.redirect("/dashboard");
      }
    }
    
    ensureStrategy(req.hostname, true); // loginOnly = true
    passport.authenticate(`replitauth-loginonly:${req.hostname}`, {
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  // Signup route - allows creating new accounts (from /signup page)
  app.get("/api/signup", (req, res, next) => {
    if (req.isAuthenticated()) {
      const user = req.user as any;
      const now = Math.floor(Date.now() / 1000);
      if (user.expires_at && now <= user.expires_at) {
        return res.redirect("/dashboard");
      }
    }
    
    ensureStrategy(req.hostname, false); // loginOnly = false
    passport.authenticate(`replitauth:${req.hostname}`, {
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  // Callback for login-only (existing users)
  app.get("/api/callback-login", (req, res, next) => {
    ensureStrategy(req.hostname, true);
    passport.authenticate(`replitauth-loginonly:${req.hostname}`, {
      successReturnToOrRedirect: "/dashboard",
      failureRedirect: "/?error=account_not_found",
    })(req, res, next);
  });

  // Callback for signup (new or existing users)
  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname, false);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/dashboard",
      failureRedirect: "/signup",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

const DEV_TEST_USER = {
  claims: {
    sub: "test-user-123",
    email: "test@example.com",
    first_name: "Test",
    last_name: "User",
  },
  expires_at: Math.floor(Date.now() / 1000) + 86400,
};

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    (req as any).user = DEV_TEST_USER;
    return next();
  }

  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
