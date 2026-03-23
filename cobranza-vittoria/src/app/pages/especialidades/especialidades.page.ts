import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../core/services/notification.service';

import { MaestraService } from '../../core/services/maestra.service';

@Component({
  standalone: true,
  selector: 'app-especialidades-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './especialidades.page.html',
  styleUrl: './especialidades.page.css'
})
export class EspecialidadesPage implements OnInit {
  rows: any[] = [];
  form: any = { nombre: '', descripcion: '', activo: true };
  msg = '';
  constructor(private maestra: MaestraService, private notifyService: NotificationService, private cdr: ChangeDetectorRef) {}
  ngOnInit(){ this.load(); }
  load(){ this.maestra.especialidades().subscribe(x => { this.rows = x; this.cdr.detectChanges(); }); }
  edit(row:any){ this.form = { ...row }; }
  reset(){ this.form = { nombre: '', descripcion: '', activo: true }; }
  save(){
    this.maestra.guardarEspecialidad(this.form).subscribe({
      next: ()=>{ this.msg='Especialidad guardada correctamente.'; this.notifyService.show(this.msg, 'success'); this.reset(); this.load(); this.cdr.detectChanges(); },
      error: e => { this.msg = e?.error?.message || 'No se pudo guardar la especialidad.'; this.notifyService.show(this.msg, 'error'); this.cdr.detectChanges(); }
    });
  }
}
