# Realismo y variantes de objetos

## Uso

En **Mapa → Colocar en el mapa → Terreno**, elige un objeto. Debajo aparece **Aspecto**, con miniaturas dibujadas por el mismo motor que pinta el mapa.

- **Árboles:** copa frondosa, conífera, palmera y sauce.
- **Agua:** estanque de bosque, manantial pedregoso, laguna con juncos y estanque de arcilla.
- **Nidos:** tierra oscura, montículo arenoso y raíces con hojarasca.
- **Rocas:** roca de campo, granito, pizarra, arenisca, caliza, volcánica, cuarcita y ferruginosa.

Son **19 variantes explícitas**, más la opción automática «Variedad natural». En árboles, la opción automática conserva la forma asociada al fruto. En agua, nidos y rocas, la semilla determina la variante. Los acabados de las rocas conservan su variación natural por semilla.

Para cambiar uno ya colocado, selecciona una herramienta de terreno y pulsa el objeto en el mapa. El encabezado muestra su tipo e identificador. El cambio se aplica a ese objeto y también queda como preferencia para las siguientes colocaciones de ese tipo durante la sesión. «Terminar de editar aspecto» vuelve a la colocación.

## Aspecto

- Tres nuevas copas de apariencia fotográfica, generadas con ImageGen y transparencia real, para coníferas, palmeras y sauces. Se conservan viento, envejecimiento y fruto del motor. La copa frondosa reutiliza su imagen existente con tintado más natural.
- Los estanques reutilizan la base fotográfica, con diferentes tonos, piedras, sedimento, juncos y grietas en las orillas. No son cuatro fotografías independientes.
- Nidos con distintos suelos, canales de erosión y materia vegetal.
- Frutos con doce variaciones por tipo, poros, reflejos suaves, inclusiones y detalles de superficie. Los cristales reflejan luz en lugar de proyectar un halo luminoso.
- Objetos pequeños con volumen, sombras de contacto, fibras, costillas y texturas; los charcos tienen bordes irregulares y sedimento visible.
- No se modifican los archivos de dibujo de Fagi.

## Estado y rendimiento

`object-appearance.js` define el catálogo sin DOM. `appearance-editor.js` proporciona la UI. El dato `object.appearance` solo interviene en el dibujo: no cambia radio, colisiones, fruto, composición, propiedades aprendidas ni conducta.

`obj_appearance` graba cambios durante el juego. Los objetos iniciales incluyen su apariencia en `obj_add`; los objetos colocados por el usuario también conservan su semilla visual. El reproductor valida las variantes y admite sesiones anteriores sin ese campo.

Las texturas procedurales se almacenan en cachés acotadas. Las nuevas imágenes se guardan como WebP sin pérdidas y con alfa en `public/assets/tree-*-v2.webp` (aproximadamente 6 MB en total). Los dibujos procedurales siguen funcionando mientras las imágenes cargan o si fallan.

## Comprobaciones

- Pruebas de independencia de propiedades físicas y validación por tipo.
- Grabación y reproducción de variantes, tanto iniciales como modificadas en directo.
- Suite existente de grabación/reproducción: 9 pruebas en total junto con las nuevas.
- Comprobación en Chrome del selector, vistas previas, móvil sin desbordamiento, colocación y edición de un árbol, y presencia de la variante en los eventos enviados a una API simulada.
- Build de producción. Persiste la advertencia previa de Vite sobre el tamaño del paquete principal.
