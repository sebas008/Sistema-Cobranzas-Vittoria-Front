import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CatalogosService } from '../../core/services/catalogos.service';
import { RequerimientosService } from '../../core/services/requerimientos.service';
import { CotizacionesService } from '../../core/services/cotizaciones.service';
import { OrdenesCompraService } from '../../core/services/ordenes-compra.service';

import { CategoriaGasto, Proveedor, Material } from '../../models/catalogos.models';
import { RequerimientoCreate } from '../../models/requerimientos.models';
import { CotizacionCreate } from '../../models/cotizaciones.models';
import { OrdenCompraGetResponse } from '../../models/ordenes-compra.models';

@Component({
  standalone: true,
  selector: 'app-oc-paso1',
  imports: [CommonModule, FormsModule],
  templateUrl: './oc-paso1.page.html',
  styleUrls: ['./oc-paso1.page.css']
})
export class OcPaso1Page implements OnInit {
  categorias: CategoriaGasto[] = [];
  proveedores: Proveedor[] = [];
  materiales: Material[] = [];

  idCategoria: number | null = null;
  solicitante = 'Residente de Obra';

  reqItems: { idMaterial: number; cantidad: number; observacion?: string | null }[] = [];
  selectedMaterialId: number | null = null;
  cantidad = 1;

  idRequerimiento: number | null = null;

  idProveedorCotizacion: number | null = null;
  precioUnitario = 10;
  idCotizacion: number | null = null;

  idProveedorOC: number | null = null;
  idOrdenCompra: number | null = null;
  ocDetalle: OrdenCompraGetResponse | null = null;

  msg = '';

  constructor(
    private catalogos: CatalogosService,
    private req: RequerimientosService,
    private cot: CotizacionesService,
    private oc: OrdenesCompraService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarCatalogos();
  }

  cargarCatalogos() {
    this.catalogos.categorias().subscribe(x => { this.categorias = x; this.cdr.detectChanges(); });
    this.catalogos.proveedores().subscribe(x => { this.proveedores = x; this.cdr.detectChanges(); });
    this.cargarMateriales();
  }

  cargarMateriales() {
    this.catalogos.materiales(this.idCategoria).subscribe(x => { this.materiales = x; this.cdr.detectChanges(); });
  }

  addItem() {
    if (!this.selectedMaterialId) return;
    if (!this.cantidad || this.cantidad <= 0) return;

    this.reqItems.push({ idMaterial: this.selectedMaterialId, cantidad: this.cantidad, observacion: null });
    this.selectedMaterialId = null;
    this.cantidad = 1;
  }

  removeItem(idx: number) {
    this.reqItems.splice(idx, 1);
  }

  crearRequerimiento() {
    const dto: RequerimientoCreate = {
      solicitante: this.solicitante,
      items: this.reqItems
    };

    this.req.crear(dto).subscribe({
      next: r => {
        this.idRequerimiento = r.idRequerimiento;
        this.msg = `✅ Requerimiento creado: ${this.idRequerimiento}`;
        this.cdr.detectChanges();
      },
      error: e => { this.msg = `❌ Error: ${e?.error?.message || e.message}`; this.cdr.detectChanges(); }
    });
  }

  crearCotizacion() {
    if (!this.idRequerimiento || !this.idProveedorCotizacion) return;

    const dto: CotizacionCreate = {
      idProveedor: this.idProveedorCotizacion,
      items: this.reqItems.map(i => ({
        idMaterial: i.idMaterial,
        cantidad: i.cantidad,
        precioUnitario: this.precioUnitario
      }))
    };

    this.cot.crear(this.idRequerimiento, dto).subscribe({
      next: r => {
        this.idCotizacion = r.idCotizacion;
        this.msg = `✅ Cotización creada: ${this.idCotizacion}`;
        this.cdr.detectChanges();
      },
      error: e => { this.msg = `❌ Error: ${e?.error?.message || e.message}`; this.cdr.detectChanges(); }
    });
  }

  generarOC() {
    if (!this.idRequerimiento || !this.idProveedorOC) return;

    this.oc.generar({ idRequerimiento: this.idRequerimiento, idProveedor: this.idProveedorOC }).subscribe({
      next: r => {
        this.idOrdenCompra = r.idOrdenCompra;
        this.msg = `✅ OC generada: ${this.idOrdenCompra} | Total: ${r.total}`;
        this.cdr.detectChanges();
      },
      error: e => { this.msg = `❌ Error: ${e?.error?.message || e.message}`; this.cdr.detectChanges(); }
    });
  }

  verOC() {
    if (!this.idOrdenCompra) return;
    this.oc.obtener(this.idOrdenCompra).subscribe({
      next: r => { this.ocDetalle = r; this.cdr.detectChanges(); },
      error: e => { this.msg = `❌ Error: ${e?.error?.message || e.message}`; this.cdr.detectChanges(); }
    });
  }
}
