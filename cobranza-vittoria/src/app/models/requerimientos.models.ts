export interface RequerimientoItemCreate {
  idMaterial: number;
  cantidad: number;
  observacion?: string | null;
}

export interface RequerimientoCreate {
  solicitante: string;
  items: RequerimientoItemCreate[];
}

export interface Requerimiento {
  idRequerimiento: number;
  fecha: string;
  solicitante: string;
  estado: string;
}

export interface RequerimientoDetalle {
  idRequerimientoDetalle: number;
  idMaterial: number;
  descripcion: string;
  unidadMedida: string;
  cantidad: number;
  observacion?: string | null;
}

export interface CotizacionResumen {
  idCotizacion: number;
  idProveedor: number;
  razonSocial: string;
  fecha: string;
  estado: string;
}

export interface RequerimientoGetResponse {
  requerimiento: Requerimiento;
  items: RequerimientoDetalle[];
  cotizaciones: CotizacionResumen[];
}
