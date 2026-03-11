export interface CategoriaGasto {
  idCategoriaGasto: number;
  nombre: string;
  activo: boolean;
}

export interface Proveedor {
  idProveedor: number;
  razonSocial: string;
  ruc?: string;
  telefono?: string;
  email?: string;
  activo: boolean;
}

export interface Material {
  idMaterial: number;
  idCategoriaGasto: number;
  descripcion: string;
  unidadMedida: string;
  categoria?: string;
}
