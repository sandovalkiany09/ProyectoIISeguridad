# Imagen base
FROM node:20

# Carpeta de trabajo
WORKDIR /ProyectoIISeguridad

# Copiar dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar todo el proyecto
COPY . .

# Exponer puerto
EXPOSE 8080

# Comando para correr la app
CMD ["node", "app.js"]