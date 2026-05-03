import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SunatService } from '../../../core/services/sunat.service';

@Component({
  selector: 'app-tipo-cambio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tipo-cambio.component.html',
  styleUrl: './tipo-cambio.component.css'
})
export class TipoCambioComponent implements OnInit {
  private readonly sunatService = inject(SunatService);
  private readonly destroyRef = inject(DestroyRef);
  readonly tipoCambio$ = this.sunatService.tipoCambio$;
  fechaSeleccionada = '';

  ngOnInit(): void {
    this.tipoCambio$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((tipoCambio) => {
        const fecha = this.normalizarFechaInput(tipoCambio?.date);
        if (fecha) this.fechaSeleccionada = fecha;
      });

    this.sunatService.consultarTipoCambio();
  }

  onFechaChange(fecha: string): void {
    const fechaNormalizada = this.normalizarFechaInput(fecha);
    this.fechaSeleccionada = fechaNormalizada;
    this.sunatService.consultarTipoCambio(fechaNormalizada || undefined);
  }

  formatFecha(fecha: string | null | undefined): string {
    if (!fecha) return '--/--/----';

    const fechaBase = fecha.split('T')[0];
    const partes = fechaBase.split('-');
    if (partes.length !== 3) return fecha;

    const [year, month, day] = partes;
    return `${day}/${month}/${year}`;
  }

  private normalizarFechaInput(fecha: string | null | undefined): string {
    if (!fecha) return '';
    const fechaBase = fecha.split('T')[0];
    const partes = fechaBase.split('-');
    return partes.length === 3 ? fechaBase : '';
  }
}
