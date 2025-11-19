# Estágio de Build
FROM node:20-alpine as build

WORKDIR /app

# Copia os arquivos de manifesto de dependências
COPY package.json package-lock.json* ./

# Instala as dependências
RUN npm install

# Copia o restante dos arquivos da aplicação
COPY . .

# Constrói a aplicação para produção
RUN npm run build

# Estágio de Produção
FROM nginx:1.25-alpine

# Copia os arquivos de build do estágio anterior para o diretório do Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copia uma configuração personalizada do Nginx para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe a porta 80
EXPOSE 80

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]
