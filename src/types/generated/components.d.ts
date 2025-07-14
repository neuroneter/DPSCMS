import type { Schema, Struct } from '@strapi/strapi';

export interface HerramientasComplete extends Struct.ComponentSchema {
  collectionName: 'components_herramientas_completes';
  info: {
    description: '';
    displayName: 'Complete';
  };
  attributes: {
    complete: Schema.Attribute.RichText & Schema.Attribute.Required;
    nombre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 300;
      }>;
  };
}

export interface HerramientasDialogo extends Struct.ComponentSchema {
  collectionName: 'components_herramientas_dialogos';
  info: {
    description: '';
    displayName: 'Dialogo';
  };
  attributes: {
    audio_fin: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 5;
      }>;
    audio_inicio: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 5;
      }>;
    dialogo: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 250;
      }>;
    ordenar: Schema.Attribute.Integer;
    personaje: Schema.Attribute.Relation<
      'oneToOne',
      'api::personaje.personaje'
    >;
  };
}

export interface HerramientasMemoria extends Struct.ComponentSchema {
  collectionName: 'components_herramientas_memorias';
  info: {
    description: '';
    displayName: 'Memoria';
  };
  attributes: {
    nombre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 300;
      }>;
    tarjetas: Schema.Attribute.Media<'images', true> &
      Schema.Attribute.Required;
  };
}

export interface HerramientasPregunta extends Struct.ComponentSchema {
  collectionName: 'components_herramientas_preguntas';
  info: {
    description: '';
    displayName: 'Pregunta';
  };
  attributes: {
    audio_fin: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 5;
      }>;
    audio_inicio: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 5;
      }>;
    ordenar: Schema.Attribute.Integer;
    Pregunta: Schema.Attribute.RichText & Schema.Attribute.Required;
    Respuestas: Schema.Attribute.Component<'herramientas.respuestas', true>;
  };
}

export interface HerramientasRelacion extends Struct.ComponentSchema {
  collectionName: 'components_herramientas_relacions';
  info: {
    description: '';
    displayName: 'Relacion';
  };
  attributes: {
    nombre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 300;
      }>;
    palabras: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 500;
      }>;
    relacion: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 500;
      }>;
  };
}

export interface HerramientasRespuestas extends Struct.ComponentSchema {
  collectionName: 'components_herramientas_respuestas';
  info: {
    description: '';
    displayName: 'Respuestas';
  };
  attributes: {
    Opcion: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 500;
      }>;
    Verdadera: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<true>;
  };
}

export interface HerramientasSopaDeLetras extends Struct.ComponentSchema {
  collectionName: 'components_herramientas_sopa_de_letras';
  info: {
    description: '';
    displayName: 'Sopa de letras';
  };
  attributes: {
    nombre: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 300;
      }>;
    palabras: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 500;
      }>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'herramientas.complete': HerramientasComplete;
      'herramientas.dialogo': HerramientasDialogo;
      'herramientas.memoria': HerramientasMemoria;
      'herramientas.pregunta': HerramientasPregunta;
      'herramientas.relacion': HerramientasRelacion;
      'herramientas.respuestas': HerramientasRespuestas;
      'herramientas.sopa-de-letras': HerramientasSopaDeLetras;
    }
  }
}
