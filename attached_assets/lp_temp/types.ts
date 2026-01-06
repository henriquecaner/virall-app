import React from 'react';

export interface FaqItem {
  question: string;
  answer: string | React.ReactNode;
}

export interface Benefit {
  title: string;
  description: string;
  icon: React.ElementType;
}