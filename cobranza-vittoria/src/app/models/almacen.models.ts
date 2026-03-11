
export interface KardexMovimiento {
  idKardexMovimiento: number;
  material?: string | null;
  especialidad?: string | null;
  tipoMovimiento: string;
  fechaMovimiento: string;
  cantidadEntrada: number;
  cantidadSalida: number;
  stockResultante: number;
  observacion?: string | null;
}

export interface KardexResumenMaterial {
  idMaterial: number;
  material: string;
  especialidad: string;
  unidadMedida: string;
  totalEntradas: number;
  totalSalidas: number;
  stockActual: number;
}
