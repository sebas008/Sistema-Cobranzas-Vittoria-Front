import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ComprasService } from '../../core/services/compras.service';
import { GastosAdministrativosService } from '../../core/services/gastos-administrativos.service';
import { ValorizacionesService } from '../../core/services/valorizaciones.service';
import { MaestraService } from '../../core/services/maestra.service';

interface ResumenEspecialidadRow {
  especialidad: string;
  orden: number;
  compras: number;
  gastosAdministrativos: number;
  valorizacionesFacturadas: number;
  valorizacionesTransferidas: number;
  valorizacionesPendientes: number;
  totalGestionado: number;
}

@Component({
  standalone: true,
  selector: 'app-resumen-total-page',
  imports: [CommonModule],
  templateUrl: './resumen-total.page.html',
  styleUrl: './resumen-total.page.css'
})
export class ResumenTotalPage implements OnInit {
  loading = false;
  msg = '';

  especialidades: any[] = [];
  comprasRows: any[] = [];
  gastosRows: any[] = [];
  valorizacionesRows: any[] = [];

  resumenPorEspecialidad: ResumenEspecialidadRow[] = [];

  totalCompras = 0;
  totalGastosAdministrativos = 0;
  totalValorizacionesFacturadas = 0;
  totalValorizacionesTransferidas = 0;
  totalValorizacionesPendientes = 0;
  totalGeneral = 0;

  constructor(
    private comprasService: ComprasService,
    private gastosService: GastosAdministrativosService,
    private valorizacionesService: ValorizacionesService,
    private maestraService: MaestraService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.msg = '';

    forkJoin({
      especialidades: this.maestraService.especialidades(true),
      compras: this.comprasService.compras(),
      gastos: this.gastosService.gastos({ activo: 'true' }),
      valorizaciones: this.valorizacionesService.valorizaciones()
    }).subscribe({
      next: ({ especialidades, compras, gastos, valorizaciones }) => {
        this.especialidades = Array.isArray(especialidades) ? especialidades : [];
        this.comprasRows = Array.isArray(compras) ? compras : [];
        this.gastosRows = Array.isArray(gastos) ? gastos : [];
        this.valorizacionesRows = Array.isArray(valorizaciones) ? valorizaciones : [];
        this.buildResumen();
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.msg = e?.error?.message || 'No se pudo cargar el resumen total.';
        this.loading = false;
        this.cdr.detectChanges();
      },
      complete: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  formatMoney(value: any, currency: 'PEN' | 'USD' = 'PEN'): string {
    const number = Number(value || 0);
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(number);
  }

  private buildResumen(): void {
    const ordenEspecialidades = new Map<string, number>();
    const nombresEspecialidad = new Map<string, string>();

    this.especialidades.forEach((item: any, index: number) => {
      const nombre = String(item?.nombre || item?.Nombre || '').trim();
      if (!nombre) return;
      ordenEspecialidades.set(nombre.toLowerCase(), index + 1);
      nombresEspecialidad.set(nombre.toLowerCase(), nombre);
    });

    const bucket = new Map<string, ResumenEspecialidadRow>();
    const ensureRow = (especialidadRaw: any): ResumenEspecialidadRow => {
      const raw = String(especialidadRaw || '').trim();
      const key = raw ? raw.toLowerCase() : 'sin-especialidad';
      if (!bucket.has(key)) {
        const nombre = raw || 'Sin especialidad';
        bucket.set(key, {
          especialidad: nombresEspecialidad.get(key) || nombre,
          orden: ordenEspecialidades.get(key) ?? 9999,
          compras: 0,
          gastosAdministrativos: 0,
          valorizacionesFacturadas: 0,
          valorizacionesTransferidas: 0,
          valorizacionesPendientes: 0,
          totalGestionado: 0
        });
      }
      return bucket.get(key)!;
    };

    this.totalCompras = 0;
    this.totalGastosAdministrativos = 0;
    this.totalValorizacionesFacturadas = 0;
    this.totalValorizacionesTransferidas = 0;
    this.totalValorizacionesPendientes = 0;

    for (const row of this.comprasRows) {
      const especialidad = this.readValue(row, 'especialidad', 'Especialidad', 'nombreEspecialidad', 'NombreEspecialidad');
      const monto = Number(this.readValue(row, 'montoTotal', 'MontoTotal', 'total', 'Total') || 0);
      const target = ensureRow(especialidad);
      target.compras += monto;
      this.totalCompras += monto;
    }

    for (const row of this.gastosRows) {
      const monto = Number(this.readValue(row, 'monto', 'Monto', 'total', 'Total') || 0);
      const especialidad = this.readValue(row, 'especialidad', 'Especialidad', 'nombreEspecialidad', 'NombreEspecialidad');
      const target = ensureRow(especialidad || 'Sin especialidad');
      target.gastosAdministrativos += monto;
      this.totalGastosAdministrativos += monto;
    }

    for (const row of this.valorizacionesRows) {
      const especialidad = this.readValue(row, 'especialidad', 'Especialidad');
      const facturado = Number(this.readValue(row, 'facturado', 'Facturado') || 0);
      const transferido = Number(this.readValue(row, 'transferido', 'Transferido') || 0);
      const resta = Number(this.readValue(row, 'resta', 'Resta') || 0);
      const target = ensureRow(especialidad);
      target.valorizacionesFacturadas += facturado;
      target.valorizacionesTransferidas += transferido;
      target.valorizacionesPendientes += resta;
      this.totalValorizacionesFacturadas += facturado;
      this.totalValorizacionesTransferidas += transferido;
      this.totalValorizacionesPendientes += resta;
    }

    this.resumenPorEspecialidad = Array.from(bucket.values())
      .map((row) => ({
        ...row,
        totalGestionado: row.compras + row.gastosAdministrativos + row.valorizacionesFacturadas
      }))
      .sort((a, b) => {
        if (a.orden !== b.orden) return a.orden - b.orden;
        return a.especialidad.localeCompare(b.especialidad, 'es');
      });

    this.totalGeneral = this.totalCompras + this.totalGastosAdministrativos + this.totalValorizacionesFacturadas;
  }

  private readValue<T = any>(row: any, ...keys: string[]): T | null {
    for (const key of keys) {
      if (row && row[key] !== undefined && row[key] !== null) {
        return row[key] as T;
      }
    }
    return null;
  }
}
