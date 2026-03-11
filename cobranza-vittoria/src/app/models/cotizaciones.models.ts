export interface CotizacionItemCreate {
  idMaterial: number;
  cantidad: number;
  precioUnitario: number;
}

export interface CotizacionCreate {
  idProveedor: number;
  items: CotizacionItemCreate[];
}

export interface Cotizacion {
  idCotizacion: number;
  idRequerimiento: number;
  idProveedor: number;
  razonSocial: string;
  fecha: string;
  estado: string;
}

export interface CotizacionDetalle {
  idCotizacionDetalle: number;
  idMaterial: number;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

export interface CotizacionGetResponse {
  cotizacion: Cotizacion;
  items: CotizacionDetalle[];
}
