# Como Reduzir o Tamanho do Repositório Git

O repositório está grande (~100MB+) porque a pasta `attached_assets/` com imagens, PDFs e outros arquivos grandes foi commitada no histórico do Git.

## Solução Rápida (Recomendada)

### Passo 1: Fazer backup local
Antes de qualquer coisa, faça backup do repositório:
```bash
cp -r seu-repo seu-repo-backup
```

### Passo 2: Remover arquivos grandes do histórico

Use o `git filter-repo` (mais seguro e rápido):

```bash
# Instalar git-filter-repo
pip install git-filter-repo

# Remover a pasta attached_assets/ de TODO o histórico
git filter-repo --path attached_assets/ --invert-paths

# OU remover todos os arquivos maiores que 10MB
git filter-repo --strip-blobs-bigger-than 10M
```

**Alternativa com BFG Repo-Cleaner:**
```bash
# Baixar BFG: https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-folders attached_assets your-repo.git
java -jar bfg.jar --strip-blobs-bigger-than 50M your-repo.git
```

### Passo 3: Limpar objetos órfãos
```bash
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Passo 4: Forçar push para o GitHub
```bash
git push origin --force --all
git push origin --force --tags
```

### Passo 5: Todos da equipe devem re-clonar
Após a limpeza, TODOS os colaboradores devem deletar o repositório local e clonar novamente:
```bash
cd ..
rm -rf nome-do-repo
git clone <url-do-repo>
```

## Resultado Esperado

- **Antes:** ~117MB (pasta .git) + 107MB (attached_assets)
- **Depois:** ~5-10MB (apenas código)

## Prevenção Futura

O `.gitignore` já foi atualizado para ignorar:
- `attached_assets/`
- Arquivos de imagem (*.png, *.jpg, *.jpeg, *.gif)
- Arquivos de mídia (*.mp4, *.mov)
- Arquivos compactados (*.zip, *.tar.gz)
- PDFs (*.pdf)
- Arquivos do Photoshop (*.psd)

## Notas Importantes

1. **Esta operação reescreve o histórico do Git** - coordene com sua equipe antes de executar
2. **Faça backup antes** de qualquer limpeza
3. **Force push é necessário** após reescrever o histórico
4. Se você usa assets no código, considere hospedar imagens em um CDN como Cloudinary ou AWS S3
