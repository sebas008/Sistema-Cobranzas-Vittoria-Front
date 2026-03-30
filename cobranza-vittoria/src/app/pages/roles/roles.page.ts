import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeguridadService } from '../../core/services/seguridad.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  standalone: true,
  selector: 'app-roles-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './roles.page.html',
  styleUrl: './roles.page.css'
})
export class RolesPage implements OnInit {
  rows: any[] = [];
  filtroActivo: boolean | null = null;
  msg = '';
  form: any = { idRol: null, nombreRol: '', descripcion: '', activo: true };

  constructor(
    private seguridad: SeguridadService,
    private notifyService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() { this.load(); }

  load() {
    this.seguridad.roles(this.filtroActivo).subscribe(x => {
      this.rows = x || [];
      this.cdr.detectChanges();
    });
  }

  edit(row: any) {
    this.form = {
      idRol: row.idRol ?? null,
      nombreRol: row.nombreRol ?? row.nombre ?? '',
      descripcion: row.descripcion ?? '',
      activo: row.activo ?? true
    };
  }

  reset() {
    this.form = { idRol: null, nombreRol: '', descripcion: '', activo: true };
    this.msg = '';
  }

  save() {
    const payload = {
      idRol: this.form.idRol ? Number(this.form.idRol) : null,
      nombreRol: (this.form.nombreRol ?? '').toString().trim(),
      descripcion: (this.form.descripcion ?? '').toString().trim(),
      activo: !!this.form.activo
    };

    if (!payload.nombreRol) {
      this.msg = 'Debes ingresar el nombre del rol.';
      this.notifyService.show(this.msg, 'error');
      return;
    }

    this.seguridad.guardarRol(payload).subscribe({
      next: () => {
        this.msg = payload.idRol ? 'Rol actualizado correctamente.' : 'Rol guardado correctamente.';
        this.notifyService.show(this.msg, 'success');
        this.reset();
        this.load();
        this.cdr.detectChanges();
      },
      error: e => {
        this.msg = e?.error?.message || 'No se pudo guardar el rol.';
        this.notifyService.show(this.msg, 'error');
        this.cdr.detectChanges();
      }
    });
  }
}
