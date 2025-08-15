# Base de Conocimiento - Carlos Castellanos

Esta carpeta contiene la base de conocimiento estructurada de Carlos Castellanos, diseñada para ser utilizada como embedding para sistemas de IA y chatbots.

## Estructura de Archivos

```
/knowledge
├── README.md                     # Este archivo
├── cv.md                        # Currículum vitae completo
├── about.md                     # Información personal y filosofía profesional
├── stack.md                     # Stack tecnológico detallado
└── proyectos/                   # Proyectos específicos
    ├── seguimiento_pacientes.md # App móvil Flutter para salud
    ├── smiletofit.md           # Plataforma web de salud y bienestar
    ├── portal_garantias.md     # Sistema de gestión automotriz
    ├── rpa_automatizacion.md   # Scripts de automatización RPA
    └── sistema_aduanal.md      # Sistema integral aduanero
```

## Contenido de Cada Archivo

### cv.md

- **Propósito:** Información curricular estructurada
- **Contenido:** Experiencia laboral, educación, habilidades técnicas, datos de contacto
- **Uso:** Respuestas sobre trayectoria profesional, experiencia y competencias

### about.md

- **Propósito:** Perfil personal y filosofía profesional
- **Contenido:** Pasiones, enfoque de trabajo, valores, motivaciones
- **Uso:** Respuestas sobre personalidad profesional, estilo de trabajo y valores

### stack.md

- **Propósito:** Conocimiento técnico detallado
- **Contenido:** Tecnologías, frameworks, herramientas, nivel de experiencia
- **Uso:** Respuestas técnicas específicas, comparaciones de tecnologías, recomendaciones

### Proyectos Específicos

#### seguimiento_pacientes.md

- **Tecnologías:** Flutter, Dart, .NET Core, PostgreSQL, AWS
- **Sector:** Salud/Medicina
- **Tipo:** Aplicación móvil
- **Características:** Historial médico, pastillero inteligente, dashboard analítico

#### smiletofit.md

- **Tecnologías:** PHP, CodeIgniter, MySQL, HTML/CSS/JS
- **Sector:** Salud/Bienestar
- **Tipo:** Aplicación web
- **Características:** E-commerce, gestión de recetas, facturación, blog

#### portal_garantias.md

- **Tecnologías:** .NET Core, PostgreSQL, AWS, Ubuntu
- **Sector:** Automotriz
- **Tipo:** Sistema web empresarial
- **Características:** Gestión de garantías, escalabilidad, mantenimiento

#### rpa_automatizacion.md

- **Tecnologías:** Python, Selenium, OCR, APIs
- **Sector:** Automatización empresarial
- **Tipo:** Scripts y bots
- **Características:** Web scraping, procesamiento de documentos, integración

#### sistema_aduanal.md

- **Tecnologías:** .NET Framework, SQL Server, Windows Forms
- **Sector:** Comercio exterior
- **Tipo:** Sistema de escritorio
- **Características:** Cumplimiento regulatorio, facturación fiscal, integración gubernamental

## Características de los Contenidos

### Estructura Consistente

Todos los archivos de proyectos siguen una estructura similar:

- Descripción del proyecto
- Características principales
- Stack tecnológico
- Módulos funcionales
- Logros y resultados
- Desafíos superados
- Tecnologías futuras

### Información Detallada

- **Tecnologías específicas:** Versiones, librerías, frameworks utilizados
- **Resultados cuantitativos:** Métricas de mejora y rendimiento
- **Desafíos técnicos:** Problemas específicos resueltos
- **Impacto de negocio:** Beneficios organizacionales y operativos

### Contexto de Negocio

- **Sectores de aplicación:** Salud, automotriz, comercio exterior, automatización
- **Tipos de soluciones:** Web, móvil, escritorio, automatización
- **Escalas de proyecto:** Desde scripts hasta sistemas empresariales complejos
- **Metodologías:** Ágil, arquitectura limpia, mejores prácticas

## Uso Recomendado para Embeddings

### Chunking Strategy

- **Por secciones:** Cada sección (## heading) puede ser un chunk independiente
- **Por proyectos:** Cada archivo de proyecto puede ser un chunk completo
- **Por tecnologías:** Agrupar información técnica por stack tecnológico
- **Por competencias:** Agrupar por habilidades y experiencias relacionadas

### Metadatos Sugeridos

```json
{
  "file": "proyectos/seguimiento_pacientes.md",
  "section": "Stack Tecnológico",
  "technologies": ["Flutter", "Dart", ".NET Core", "PostgreSQL", "AWS"],
  "sector": "Salud",
  "project_type": "Aplicación móvil",
  "experience_level": "Senior",
  "keywords": ["medicina", "pastillero", "historial médico", "dashboard"]
}
```

### Queries Típicas que Puede Responder

- "¿Qué experiencia tienes con Flutter?"
- "¿Has trabajado en proyectos de salud?"
- "¿Cuál es tu nivel en .NET Core?"
- "¿Qué tipos de automatización has desarrollado?"
- "¿Has trabajado con AWS?"
- "¿Tienes experiencia en sistemas empresariales?"
- "¿Qué metodologías de desarrollo utilizas?"
- "¿Has integrado sistemas con APIs gubernamentales?"

### Casos de Uso del Chatbot

1. **Consultas técnicas:** Responder sobre tecnologías específicas y experiencia
2. **Matching de proyectos:** Identificar experiencia relevante para nuevos proyectos
3. **Recomendaciones:** Sugerir enfoques técnicos basados en experiencia previa
4. **Estimaciones:** Proporcionar estimaciones basadas en proyectos similares
5. **Mejores prácticas:** Compartir lecciones aprendidas y recomendaciones

## Mantenimiento de la Base de Conocimiento

### Actualizaciones Regulares

- **Nuevos proyectos:** Agregar nuevos proyectos completados
- **Tecnologías emergentes:** Actualizar stack con nuevas tecnologías aprendidas
- **Mejoras de proyectos:** Actualizar resultados y mejoras implementadas
- **Certificaciones:** Agregar nuevas certificaciones y cursos completados

### Versionado

- Mantener historial de cambios en Git
- Usar semantic versioning para actualizaciones mayores
- Documentar cambios significativos en experiencia o tecnologías

### Calidad del Contenido

- Revisar precisión técnica regularmente
- Actualizar métricas y resultados con datos recientes
- Mantener consistencia en terminología y estructura
- Validar que la información sigue siendo relevante
