# Pendências do MVP

## Login administrativo

O login valida tamanho máximo de e-mail e senha antes da verificação de senha e aceita somente usuários com role `owner` ou `admin`.

Ainda não há rate limiter externo ou armazenamento distribuído de tentativas de login. Isso permanece como pendência antes de uma operação pública em escala, para reduzir brute force e abuso de autenticação.
