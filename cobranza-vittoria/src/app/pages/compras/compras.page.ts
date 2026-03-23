import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComprasService } from '../../core/services/compras.service';

@Component({
  standalone: true,
  selector: 'app-compras-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './compras.page.html',
  styleUrl: './compras.page.css'
})
export class ComprasPage implements OnInit {
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  pendientes: any[] = [];
  comprasCerradas: any[] = [];
  detalleOc: any = null;
  detalleCompra: any = null;
  documentos: any[] = [];
  selectedFiles: File[] = [];
  msg = '';

  form: any = {
    numeroCompra: '',
    idOrdenCompra: null,
    idProveedor: null,
    fechaCompra: '',
    incluyeIgv: true,
    observacion: ''
  };

  constructor(private compras: ComprasService, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.load(); }

  load() {
    this.compras.pendientesCompra().subscribe({
      next: (x: any) => { this.pendientes = x || []; this.cdr.detectChanges(); },
      error: () => { this.pendientes = []; this.cdr.detectChanges(); }
    });

    this.compras.compras().subscribe({
      next: (x: any) => { this.comprasCerradas = x || []; this.cdr.detectChanges(); },
      error: () => { this.comprasCerradas = []; this.cdr.detectChanges(); }
    });
  }

  procesarPendiente(row: any) {
    const idOrdenCompra = row.idOrdenCompra || row.IdOrdenCompra;
    this.compras.orden(idOrdenCompra).subscribe({
      next: (x: any) => {
        this.detalleCompra = null;
        this.detalleOc = x;
        const oc = x?.ordenCompra || x?.head || {};
        this.form = {
          numeroCompra: '',
          idOrdenCompra: oc?.idOrdenCompra ?? oc?.IdOrdenCompra ?? null,
          idProveedor: oc?.idProveedor ?? oc?.IdProveedor ?? null,
          fechaCompra: '',
          incluyeIgv: true,
          observacion: ''
        };
        this.documentos = [];
        this.selectedFiles = [];
        if (this.fileInput?.nativeElement) this.fileInput.nativeElement.value = '';
        this.msg = 'OC cargada para continuar el flujo de compra.';
        this.cdr.detectChanges();
      },
      error: () => {
        this.detalleOc = null;
        this.msg = 'No se pudo cargar la OC pendiente.';
        this.cdr.detectChanges();
      }
    });
  }

  verCompra(row: any) {
    const idCompra = row.idCompra || row.IdCompra;
    this.compras.compra(idCompra).subscribe({
      next: (x: any) => {
        this.detalleOc = null;
        this.detalleCompra = x;
        this.documentos = x?.documentos || [];
        this.selectedFiles = [];
        if (this.fileInput?.nativeElement) this.fileInput.nativeElement.value = '';
        this.cdr.detectChanges();
      },
      error: () => {
        this.detalleCompra = null;
        this.msg = 'No se pudo cargar la compra.';
        this.cdr.detectChanges();
      }
    });
  }

  onFilesSelected(event: any) {
    const files = Array.from(event?.target?.files || []) as File[];
    this.selectedFiles = files.filter((f: File) => f.name.toLowerCase().endsWith('.pdf'));
    if (!this.selectedFiles.length && files.length) {
      this.msg = 'Solo se permiten archivos PDF.';
    }
  }

  get itemsOc(): any[] {
    return this.detalleOc?.items || [];
  }

  get montoBaseConIgv(): number {
    return Math.round((this.itemsOc.reduce((acc: number, item: any) => {
      const cantidad = Number(item.cantidad || item.Cantidad || 0);
      const pu = Number(item.precioUnitario || item.PrecioUnitario || 0);
      return acc + (cantidad * pu);
    }, 0) + Number.EPSILON) * 100) / 100;
  }

  get subtotalSinIgvCalculado(): number {
    return Math.round(((this.montoBaseConIgv / 1.18) + Number.EPSILON) * 100) / 100;
  }

  get montoIgvCalculado(): number {
    return this.form.incluyeIgv
      ? Math.round(((this.montoBaseConIgv - this.subtotalSinIgvCalculado) + Number.EPSILON) * 100) / 100
      : 0;
  }

  get montoTotalCalculado(): number {
    return this.form.incluyeIgv ? this.montoBaseConIgv : this.subtotalSinIgvCalculado;
  }

  registrarCompra() {
    const dto = {
      numeroCompra: (this.form.numeroCompra || '').trim(),
      idOrdenCompra: Number(this.form.idOrdenCompra),
      idProveedor: Number(this.form.idProveedor),
      fechaCompra: this.form.fechaCompra,
      incluyeIGV: !!this.form.incluyeIgv,
      subtotalSinIGV: this.subtotalSinIgvCalculado,
      montoIGV: this.montoIgvCalculado,
      montoTotal: this.montoTotalCalculado,
      observacion: this.form.observacion || '',
      items: this.itemsOc.map((item: any) => ({
        idMaterial: Number(item.idMaterial || item.IdMaterial || 0),
        cantidad: Number(item.cantidad || item.Cantidad || 0),
        precioUnitario: Number(item.precioUnitario || item.PrecioUnitario || 0)
      }))
    };

    if (!dto.idOrdenCompra) { this.msg = 'Debes seleccionar una OC pendiente.'; return; }
    if (!dto.numeroCompra) { this.msg = 'Debes ingresar el número de compra.'; return; }
    if (!dto.idProveedor) { this.msg = 'Debe existir un proveedor en la OC.'; return; }
    if (!dto.fechaCompra) { this.msg = 'Debes ingresar la fecha de compra.'; return; }
    if (!this.selectedFiles.length) { this.msg = 'Debes adjuntar al menos un PDF antes de registrar la compra.'; return; }

    this.compras.registrarCompra(dto).subscribe({
      next: (res: any) => {
        const idCompra = res?.idCompra || res?.IdCompra;
        if (!idCompra) {
          this.msg = 'La compra se registró, pero no se obtuvo el identificador.';
          this.load();
          return;
        }

        this.compras.uploadDocumentosCompra(idCompra, this.selectedFiles).subscribe({
          next: () => {
            this.msg = 'Compra registrada y documentos subidos correctamente.';
            this.resetForm();
            this.load();
            this.cdr.detectChanges();
          },
          error: (e: any) => {
            this.msg = e?.error?.message || 'La compra se registró, pero falló la subida de documentos.';
            this.resetForm();
            this.load();
            this.cdr.detectChanges();
          }
        });
      },
      error: (e: any) => {
        this.msg = e?.error?.message || 'No se pudo registrar la compra.';
        this.cdr.detectChanges();
      }
    });
  }

  resetForm() {
    this.detalleOc = null;
    this.detalleCompra = null;
    this.documentos = [];
    this.selectedFiles = [];
    if (this.fileInput?.nativeElement) this.fileInput.nativeElement.value = '';
    this.form = {
      numeroCompra: '',
      idOrdenCompra: null,
      idProveedor: null,
      fechaCompra: '',
      incluyeIgv: true,
      observacion: ''
    };
  }
}
