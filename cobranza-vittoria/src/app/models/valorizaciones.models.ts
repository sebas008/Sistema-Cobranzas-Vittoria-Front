export interface ValorizacionConfiguracion {
  idConfiguracion: number;
  idProyecto: number;
  proyecto?: string | null;
  idProveedor: number;
  proveedor?: string | null;
  idEspecialidad: number;
  especialidad?: string | null;
  servicio: string;
  moneda: string;
  montoCotizacion: number;
  porcentajeGarantia?: number;
  porcentajeDetraccion?: number;
}

export interface ValorizacionCabecera {
  idValorizacion: number;
  idConfiguracion: number;
  periodo: string;
  observacion?: string | null;
  proveedor?: string | null;
  especialidad?: string | null;
  proyecto?: string | null;
  servicio?: string | null;
  moneda?: string | null;
  montoCotizacion?: number;
  porcentajeGarantia?: number;
  porcentajeDetraccion?: number;
}

export interface ValorizacionDetalle {
  idDetalle: number;
  fechaFactura?: string | null;
  numeroFactura?: string | null;
  baseImponible?: number;
  igv?: number;
  montoFactura: number;
  descripcion?: string | null;
  detraccion?: number;
  garantia?: number;
  otrosDescuentos?: number;
  aAbonar?: number;
  fechaTransferencia?: string | null;
  numeroOperacion?: string | null;
  bancoTransferencia?: string | null;
  bancoDestino?: string | null;
  montoTransferido?: number;
  aFavor?: number;
  deuda?: number;
  porcentajeAvance?: number;
  porcentajeAcumulado?: number;
  porcentajeInicial?: number;
  porcentajeFinal?: number;
}

export interface ValorizacionResumen {
  cotizacion?: number;
  garantia?: number;
  facturado?: number;
  transferido?: number;
  resta?: number;
  liquidar?: number;
}
