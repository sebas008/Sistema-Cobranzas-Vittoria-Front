export interface OrdenCompraGenerar {
  idRequerimiento: number;
  idProveedor: number;
}

export interface OrdenCompraGenerarResponse {
  idOrdenCompra: number;
  total: number;
}

export interface OrdenCompra {
  idOrdenCompra: number;
  idRequerimiento: number;
  idProveedor: number;
  razonSocial: string;
  fecha: string;
  total: number;
  estado: string;
}

export interface OrdenCompraDetalle {
  idOrdenCompraDetalle: number;
  idMaterial: number;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface OrdenCompraGetResponse {
  ordenCompra: OrdenCompra;
  items: OrdenCompraDetalle[];
}
