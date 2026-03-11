import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComprasService } from '../../core/services/compras.service';
import { MaestraService } from '../../core/services/maestra.service';
import { SeguridadService } from '../../core/services/seguridad.service';

@Component({
  standalone: true,
  selector: 'app-requerimientos-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './requerimientos.page.html',
  styleUrls: ['./requerimientos.page.css']
})
export class RequerimientosPage implements OnInit {
  rows: any[] = [];
  especialidades: any[] = [];
  proyectos: any[] = [];
  materiales: any[] = [];
  usuarios: any[] = [];
  detalle: any = null;

  form: any = {
    numeroRequerimiento: '',
    fechaRequerimiento: '',
    idEspecialidad: null,
    idProyecto: null,
    descripcion: '',
    fechaEntrega: '',
    idUsuarioSolicitante: null,
    observacion: '',
    items: []
  };

  item = {
    idMaterial: null as number | null,
    cantidad: 1,
    observacion: ''
  };

  msg = '';
  saving = false;

  constructor(
    private compras: ComprasService,
    private maestra: MaestraService,
    private seguridad: SeguridadService
  ) {}

  ngOnInit(): void {
    this.load();
    this.loadCatalogos();
  }

  load(): void {
    this.compras.requerimientos().subscribe({
      next: (x) => this.rows = x ?? [],
      error: () => this.rows = []
    });
  }

  loadCatalogos(): void {
    this.maestra.especialidades().subscribe({
      next: (x) => this.especialidades = x ?? [],
      error: () => this.especialidades = []
    });

    this.maestra.proyectos().subscribe({
      next: (x) => this.proyectos = x ?? [],
      error: () => this.proyectos = []
    });

    this.maestra.materiales().subscribe({
      next: (x) => this.materiales = x ?? [],
      error: () => this.materiales = []
    });

    this.seguridad.usuarios().subscribe({
      next: (x) => this.usuarios = x ?? [],
      error: () => this.usuarios = []
    });
  }

  addItem(): void {
    this.msg = '';

    if (!this.item.idMaterial) {
      this.msg = 'Debes seleccionar un material.';
      return;
    }

    if (!this.item.cantidad || Number(this.item.cantidad) <= 0) {
      this.msg = 'La cantidad debe ser mayor a 0.';
      return;
    }

    const material = this.materiales.find(
      m => m.idMaterial === Number(this.item.idMaterial)
    );

    this.form.items.push({
      idMaterial: Number(this.item.idMaterial),
      material: material?.descripcion ?? '',
      cantidad: Number(this.item.cantidad),
      observacion: this.item.observacion ?? ''
    });

    this.item = {
      idMaterial: null,
      cantidad: 1,
      observacion: ''
    };
  }

  removeItem(index: number): void {
    this.form.items.splice(index, 1);
  }

  view(row: any): void {
    this.compras.requerimiento(row.idRequerimiento).subscribe({
      next: (x) => this.detalle = x,
      error: () => this.detalle = null
    });
  }

  validar(id: number, resultado: string): void {
    const usuario = this.usuarios?.[0];

    if (!usuario) {
      this.msg = 'No hay usuarios disponibles para registrar la validación.';
      return;
    }

    this.compras.validarRequerimiento(id, {
      idUsuario: usuario.idUsuario,
      resultado,
      observacion: ''
    }).subscribe({
      next: () => {
        this.msg = 'Validación registrada correctamente.';
        this.load();

        if (this.detalle?.requerimiento?.idRequerimiento === id) {
          this.view({ idRequerimiento: id });
        }
      },
      error: (e) => {
        this.msg = e?.error?.message || 'No se pudo validar el requerimiento.';
      }
    });
  }

  save(): void {
    this.msg = '';

    if (!this.form.numeroRequerimiento?.trim()) {
      this.msg = 'Debes ingresar el número de requerimiento.';
      return;
    }

    if (!this.form.fechaRequerimiento) {
      this.msg = 'Debes ingresar la fecha del requerimiento.';
      return;
    }

    if (!this.form.idEspecialidad) {
      this.msg = 'Debes seleccionar una especialidad.';
      return;
    }

    if (!this.form.idProyecto) {
      this.msg = 'Debes seleccionar un proyecto.';
      return;
    }

    if (!this.form.idUsuarioSolicitante) {
      this.msg = 'Debes seleccionar un solicitante.';
      return;
    }

    if (!this.form.items.length) {
      this.msg = 'Debes agregar al menos un item.';
      return;
    }

    const dto = {
      numeroRequerimiento: this.form.numeroRequerimiento.trim(),
      fechaRequerimiento: this.form.fechaRequerimiento,
      idEspecialidad: Number(this.form.idEspecialidad),
      idProyecto: Number(this.form.idProyecto),
      descripcion: this.form.descripcion ?? '',
      fechaEntrega: this.form.fechaEntrega || null,
      idUsuarioSolicitante: Number(this.form.idUsuarioSolicitante),
      observacion: this.form.observacion ?? '',
      items: this.form.items.map((x: any) => ({
        idMaterial: Number(x.idMaterial),
        cantidad: Number(x.cantidad),
        observacion: x.observacion ?? ''
      }))
    };

    console.log('DTO requerimiento =>', dto);

    this.saving = true;

    this.compras.crearRequerimiento(dto).subscribe({
      next: (res) => {
        console.log('Respuesta crear requerimiento =>', res);

        this.saving = false;
        this.msg = `Requerimiento creado correctamente. ID: ${res?.idRequerimiento ?? ''}`;

        this.reset();
        this.load();
      },
      error: (e) => {
        console.error('Error al guardar requerimiento =>', e);
        this.saving = false;
        this.msg = e?.error?.message || 'No se pudo crear el requerimiento.';
      }
    });
  }

  reset(): void {
    this.form = {
      numeroRequerimiento: '',
      fechaRequerimiento: '',
      idEspecialidad: null,
      idProyecto: null,
      descripcion: '',
      fechaEntrega: '',
      idUsuarioSolicitante: null,
      observacion: '',
      items: []
    };

    this.item = {
      idMaterial: null,
      cantidad: 1,
      observacion: ''
    };
  }
}