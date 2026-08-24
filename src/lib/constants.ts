import { StarterTemplate, LanguageType } from '@/types';

export const STARTER_TEMPLATES: Record<LanguageType, StarterTemplate> = {
  c: {
    name: 'C',
    language: 'c',
    extension: '.c',
    defaultCode: `#include <stdio.h>

int main() {
    printf("Hello, CodeSpace!\\n");
    return 0;
}
`
  },
  cpp: {
    name: 'C++',
    language: 'cpp',
    extension: '.cpp',
    defaultCode: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, CodeSpace!" << endl;
    return 0;
}
`
  },
  python: {
    name: 'Python',
    language: 'python',
    extension: '.py',
    defaultCode: `def main():
    print("Hello, CodeSpace!")

if __name__ == "__main__":
    main()
`
  },
  java: {
    name: 'Java',
    language: 'java',
    extension: '.java',
    defaultCode: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, CodeSpace!");
    }
}
`
  }
};

export const MONACO_LANG_MAP: Record<LanguageType, string> = {
  c: 'c',
  cpp: 'cpp',
  python: 'python',
  java: 'java'
};

export const DEFAULT_FILE_NAMES: Record<LanguageType, string> = {
  c: 'main.c',
  cpp: 'arrays.cpp',
  python: 'reverse.py',
  java: 'Main.java'
};
