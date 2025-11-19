# Estágio de Build
FROM oven/bun:1 as build

WORKDIR /usr/src/app

# Copia os arquivos de manifesto de dependências
COPY package.json bun.lockb* ./

# Instala as dependências
RUN bun install --frozen-lockfile

# Copia o restante dos arquivos da aplicação
COPY . .

# Compila o TypeScript
RUN bun run build

# Estágio de Produção
FROM oven/bun:1

WORKDIR /usr/src/app

# Copia os artefatos de build e as dependências de produção
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY package.json ./

# Expõe a porta que a aplicação usa
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["bun", "start"]