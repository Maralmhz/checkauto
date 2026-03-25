# Correção do link de recuperação de senha (Supabase)

Se o e-mail de "Esqueci a senha" ainda abre `http://localhost:3000`, ajuste no painel do Supabase:

1. **Authentication → URL Configuration**
2. Defina **Site URL** como:
   - `https://checkauto.pages.dev`
3. Em **Redirect URLs**, adicione:
   - `https://checkauto.pages.dev/login.html`
   - `https://checkauto.pages.dev/**`

> Observação: o front-end já envia `redirectTo` fixo para `https://checkauto.pages.dev/login.html`, mas a configuração do projeto no Supabase precisa estar alinhada para o fluxo funcionar de ponta a ponta.
