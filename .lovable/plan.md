

## Plan: Web de Concurso de Comida 🍽️

### Concepto
Plataforma de votación para un concurso gastronómico con estilo rústico/artesanal. Los votantes acceden con un código único, votan "like" en distintas categorías por plato, y los resultados solo los ve el admin hasta que decida publicarlos.

### Diseño Visual
- **Paleta**: Tonos cálidos (marrones, cremas, terracota, verde oliva)
- **Tipografía**: Estilo serif/artesanal para títulos, sans-serif legible para cuerpo
- **Texturas**: Fondos con textura de madera/papel kraft, bordes redondeados suaves
- **Iconografía**: Estilo hand-drawn para iconos de comida

### Páginas y funcionalidades

#### 1. Página pública — Galería de platos
- Grid de tarjetas con foto del plato, nombre, autor y descripción
- Filtro por categoría
- Botón "Votar" que pide código de acceso

#### 2. Página de votación (con código)
- El usuario ingresa su código único para acceder
- Ve cada plato con las categorías de votación (like/no like por categoría)
- Una vez votado un plato, se marca como votado
- No puede votar dos veces el mismo plato en la misma categoría

#### 3. Panel de administración (con login email/contraseña)
- **Gestión de platos**: Subir foto, nombre, autor, descripción
- **Gestión de categorías**: Crear/editar/eliminar categorías de votación (ej: "Mejor presentación", "Mejor sabor")
- **Gestión de códigos**: Generar códigos de acceso para votantes
- **Resultados**: Dashboard con ranking por categoría, total de votos por plato
- **Publicar resultados**: Botón para hacer visibles los resultados en la página pública

#### 4. Página de resultados
- Oculta por defecto, visible solo cuando el admin la active
- Ranking de platos por categoría con medallas (oro, plata, bronce)

### Backend (Supabase)
- Tablas: platos, categorías, votos, códigos de acceso, configuración del concurso
- Storage para fotos de platos
- Autenticación para admin
- RLS para proteger datos

