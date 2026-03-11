import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaestraService } from '../../core/services/maestra.service';

@Component({
  standalone: true,
  selector: 'app-proyectos-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './proyectos.page.html',
  styleUrls: ['./proyectos.page.css']
})
export class ProyectosPage implements OnInit {
  rows: any[] = [];
  form: any = {
    idProyecto: null,
    nombreProyecto: '',
    descripcion: '',
    activo: true
  };

  msg = '';
  saving = false;

  constructor(private maestra: MaestraService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.maestra.proyectos().subscribe({
      next: (x) => this.rows = x ?? [],
      error: () => this.rows = []
    });
  }

  edit(row: any): void {
    this.form = {
      idProyecto: row.idProyecto,
      nombreProyecto: row.nombreProyecto ?? '',
      descripcion: row.descripcion ?? '',
      activo: row.activo ?? true
    };
    this.msg = '';
  }

  save(): void {
    this.msg = '';

    if (!this.form.nombreProyecto?.trim()) {
      this.msg = 'Debes ingresar el nombre del proyecto.';
      return;
    }

    const dto = {
      idProyecto: this.form.idProyecto,
      nombreProyecto: this.form.nombreProyecto.trim(),
      descripcion: this.form.descripcion ?? '',
      activo: !!this.form.activo
    };

    this.saving = true;

    this.maestra.guardarProyecto(dto).subscribe({
      next: (res) => {
        this.saving = false;
        this.msg = `Proyecto guardado correctamente. ID: ${res?.idProyecto ?? ''}`;
        this.reset();
        this.load();
      },
      error: (e) => {
        this.saving = false;
        this.msg = e?.error?.message || 'No se pudo guardar el proyecto.';
        console.error('Error guardando proyecto =>', e);
      }
    });
  }

  reset(): void {
    this.form = {
      idProyecto: null,
      nombreProyecto: '',
      descripcion: '',
      activo: true
    };
  }
}