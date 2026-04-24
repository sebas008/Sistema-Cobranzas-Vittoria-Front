import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaestraService } from '../../core/services/maestra.service';

type TerrenoItem = {
  idTerreno: number;
  fechaEmision: string;
  idProyecto: number | null;
  nombreProyecto: string;
  concepto: string;
  moneda: string;
  monto: number;
  descripcion: string;
  estado: string;
};

@Component({
  standalone: true,
  selector: 'app-terreno-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './terreno.page.html',
  styleUrl: './terreno.page.css'
})
export class TerrenoPage implements OnInit {
  private readonly storageKey = 'vittoria-terrenos-v3';

  proyectos: any[] = [];
  rows: TerrenoItem[] = [];
  msg = '';
  editandoId: number | null = null;

  form = {
    fechaEmision: this.todayIso(),
    idProyecto: null as number | null,
    concepto: '',
    moneda: 'PEN',
    monto: null as number | null,
    descripcion: '',
    estado: 'Activo'
  };

  constructor(private maestra: MaestraService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.maestra.proyectos(true).subscribe({
      next: (rows: any[]) => { this.proyectos = rows || []; this.cdr.detectChanges(); },
      error: () => { this.proyectos = []; this.cdr.detectChanges(); }
    });
    this.cargarRows();
  }

  guardar(): void {
    if (!this.form.idProyecto) { this.msg = 'Debes seleccionar un proyecto.'; return; }
    if (!(this.form.concepto || '').trim()) { this.msg = 'Debes ingresar el concepto.'; return; }
    if (!(Number(this.form.monto) > 0)) { this.msg = 'Debes ingresar el monto.'; return; }

    const proyecto = this.proyectos.find((p: any) => Number(p.idProyecto) === Number(this.form.idProyecto));
    const payload: TerrenoItem = {
      idTerreno: this.editandoId || this.nextId(),
      fechaEmision: this.form.fechaEmision || this.todayIso(),
      idProyecto: Number(this.form.idProyecto),
      nombreProyecto: proyecto?.nombreProyecto || '-',
      concepto: String(this.form.concepto || '').trim(),
      moneda: String(this.form.moneda || 'PEN').trim(),
      monto: Number(this.form.monto || 0),
      descripcion: String(this.form.descripcion || '').trim(),
      estado: this.form.estado || 'Activo'
    };

    const rows = [...this.rows];
    const index = rows.findIndex(x => x.idTerreno === payload.idTerreno);
    if (index >= 0) rows[index] = payload;
    else rows.unshift(payload);
    this.rows = rows;
    this.persistir();
    this.msg = this.editandoId ? 'Registro actualizado correctamente.' : 'Registro guardado correctamente.';
    this.limpiar();
  }

  editar(row: TerrenoItem): void {
    this.editandoId = row.idTerreno;
    this.form = {
      fechaEmision: row.fechaEmision || this.todayIso(),
      idProyecto: row.idProyecto,
      concepto: row.concepto,
      moneda: row.moneda || 'PEN',
      monto: row.monto,
      descripcion: row.descripcion,
      estado: row.estado || 'Activo'
    };
  }

  cambiarEstado(row: TerrenoItem): void {
    row.estado = row.estado === 'Activo' ? 'Inactivo' : 'Activo';
    this.persistir();
    this.msg = `Registro ${row.estado === 'Activo' ? 'activado' : 'desactivado'} correctamente.`;
  }

  limpiar(): void {
    this.editandoId = null;
    this.form = {
      fechaEmision: this.todayIso(),
      idProyecto: null,
      concepto: '',
      moneda: 'PEN',
      monto: null,
      descripcion: '',
      estado: 'Activo'
    };
    this.cdr.detectChanges();
  }

  private cargarRows(): void {
    try {
      const raw = localStorage.getItem(this.storageKey);
      this.rows = raw ? (JSON.parse(raw) as TerrenoItem[]) : [];
    } catch {
      this.rows = [];
    }
  }

  private persistir(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.rows));
    this.cdr.detectChanges();
  }

  private nextId(): number {
    return this.rows.reduce((acc, row) => Math.max(acc, Number(row.idTerreno || 0)), 0) + 1;
  }

  private todayIso(): string {
    const date = new Date();
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
  }
}
