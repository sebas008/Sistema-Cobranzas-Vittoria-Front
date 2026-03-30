import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class SeguridadService {
  constructor(private api: ApiService) {}

  roles(activo?: boolean | null) {
    const qs = activo === undefined || activo === null ? '' : `?activo=${activo}`;
    return this.api.http.get<any[]>(`${this.api.baseUrl}/api/seguridad/roles${qs}`);
  }

  guardarRol(dto: any) {
    return dto.idRol
      ? this.api.http.put<any>(`${this.api.baseUrl}/api/seguridad/roles/${dto.idRol}`, dto)
      : this.api.http.post<any>(`${this.api.baseUrl}/api/seguridad/roles`, dto);
  }
  usuarios(activo?: boolean | null) {
    const qs = activo === undefined || activo === null ? '' : `?activo=${activo}`;
    return this.api.http.get<any[]>(`${this.api.baseUrl}/api/seguridad/usuarios${qs}`);
  }
  usuario(id: number) { return this.api.http.get<any>(`${this.api.baseUrl}/api/seguridad/usuarios/${id}`); }
  crearUsuario(dto: any) { return this.api.http.post<any>(`${this.api.baseUrl}/api/seguridad/usuarios`, dto); }
  actualizarUsuario(id: number, dto: any) { return this.api.http.put<any>(`${this.api.baseUrl}/api/seguridad/usuarios/${id}`, dto); }
  asignarRol(id: number, idRol: number) {
    return this.api.http.post<any>(`${this.api.baseUrl}/api/seguridad/usuarios/${id}/roles`, { idUsuario: id, idRol });
  }
}
