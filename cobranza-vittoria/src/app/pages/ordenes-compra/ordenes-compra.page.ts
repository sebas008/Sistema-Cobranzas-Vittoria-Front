import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComprasService } from '../../core/services/compras.service';
import { MaestraService } from '../../core/services/maestra.service';
import { SeguridadService } from '../../core/services/seguridad.service';

@Component({
  standalone: true,
  selector: 'app-ordenes-compra-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './ordenes-compra.page.html',
  styleUrl: './ordenes-compra.page.css'
})
export class OrdenesCompraPage implements OnInit {
  rqPendientesOc: any[] = [];
  ordenesCreadas: any[] = [];
  proveedores: any[] = [];
  proyectos: any[] = [];
  usuarios: any[] = [];
  detalleRq: any = null;
  detalleOc: any = null;
  msg = '';

  form: any = {
    numeroOrdenCompra: '',
    idRequerimiento: null,
    idProveedor: null,
    idProyecto: null,
    fechaOrdenCompra: '',
    descripcion: '',
    idUsuarioCreacion: null,
    rutaPdf: '',
    items: []
  };

  constructor(
    private compras: ComprasService,
    private maestra: MaestraService,
    private seguridad: SeguridadService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.load();
    this.loadCatalogos();
  }

  load() {
    this.compras.requerimientos({ estado: 'EnviadoOC' }).subscribe({
      next: (x: any) => { this.rqPendientesOc = x || []; this.cdr.detectChanges(); },
      error: () => { this.rqPendientesOc = []; this.cdr.detectChanges(); }
    });

    this.compras.ordenes().subscribe({
      next: (x: any) => { this.ordenesCreadas = x || []; this.cdr.detectChanges(); },
      error: () => { this.ordenesCreadas = []; this.cdr.detectChanges(); }
    });
  }

  loadCatalogos() {
    this.maestra.proveedores(true).subscribe({ next: (x: any) => { this.proveedores = x || []; this.cdr.detectChanges(); }, error: () => { this.proveedores = []; this.cdr.detectChanges(); } });
    this.maestra.proyectos(true).subscribe({ next: (x: any) => { this.proyectos = x || []; this.cdr.detectChanges(); }, error: () => { this.proyectos = []; this.cdr.detectChanges(); } });
    this.seguridad.usuarios().subscribe({ next: (x: any) => { this.usuarios = x || []; this.cdr.detectChanges(); }, error: () => { this.usuarios = []; this.cdr.detectChanges(); } });
  }

  procesarRq(row: any) {
    this.compras.requerimiento(row.idRequerimiento).subscribe({
      next: (x: any) => {
        this.detalleRq = x;
        this.detalleOc = null;

        const req = x?.requerimiento;
        const items = x?.items || [];

        this.form.idRequerimiento = req?.idRequerimiento ?? null;
        this.form.idProyecto = req?.idProyecto ?? null;
        this.form.items = items.map((it: any) => ({
          especialidad: it.especialidad || req?.especialidad || row?.especialidad || '-',
          idMaterial: it.idMaterial,
          material: it.material,
          unidadMedida: it.unidadMedida,
          cantidad: Number(it.cantidad),
          idProveedor: null,
          precioUnitario: 0
        }));

        this.msg = 'RQ cargado para continuar flujo de OC.';
        this.cdr.detectChanges();
      },
      error: () => {
        this.detalleRq = null;
        this.msg = 'No se pudo cargar el requerimiento.';
        this.cdr.detectChanges();
      }
    });
  }

  verOc(row: any) {
    this.compras.orden(row.idOrdenCompra).subscribe({
      next: (x: any) => {
        this.detalleOc = x;
        this.detalleRq = null;
        this.cdr.detectChanges();
      },
      error: () => {
        this.detalleOc = null;
        this.msg = 'No se pudo cargar la orden.';
        this.cdr.detectChanges();
      }
    });
  }

  save() {
    const dto = {
      numeroOrdenCompra: (this.form.numeroOrdenCompra || '').trim(),
      idRequerimiento: Number(this.form.idRequerimiento),
      idProveedor: Number((this.form.items || []).find((x: any) => Number(x.idProveedor))?.idProveedor || 0),
      idProyecto: Number(this.form.idProyecto),
      fechaOrdenCompra: this.form.fechaOrdenCompra,
      descripcion: this.form.descripcion || '',
      idUsuarioCreacion: this.form.idUsuarioCreacion ? Number(this.form.idUsuarioCreacion) : null,
      rutaPdf: this.form.rutaPdf || '',
      items: (this.form.items || []).map((x: any) => ({
        idMaterial: Number(x.idMaterial),
        cantidad: Number(x.cantidad),
        idProveedor: Number(x.idProveedor || 0),
        precioUnitario: 0
      }))
    };

    if (!dto.idRequerimiento) { this.msg = 'Debes seleccionar un RQ enviado a OC.'; return; }
    if (!dto.numeroOrdenCompra) { this.msg = 'Debes ingresar el número de orden.'; return; }
    if (!dto.idProyecto) { this.msg = 'Debes seleccionar proyecto.'; return; }
    if (!dto.fechaOrdenCompra) { this.msg = 'Debes ingresar la fecha.'; return; }
    if (!dto.items.length) { this.msg = 'La orden debe tener items.'; return; }
    if (dto.items.some((x: any) => !x.idProveedor)) { this.msg = 'Debes seleccionar proveedor por cada material.'; return; }

    this.compras.crearOrden(dto).subscribe({
      next: () => {
        this.msg = 'Orden creada correctamente.';
        this.resetFormulario();
        this.load();
        this.cdr.detectChanges();
      },
      error: (e: any) => { this.msg = e?.error?.message || 'No se pudo guardar la orden.'; this.cdr.detectChanges(); }
    });
  }

  resetFormulario() {
    this.detalleRq = null;
    this.form = {
      numeroOrdenCompra: '',
      idRequerimiento: null,
      idProveedor: null,
      idProyecto: null,
      fechaOrdenCompra: '',
      descripcion: '',
      idUsuarioCreacion: null,
      rutaPdf: '',
      items: []
    };
  }
}
