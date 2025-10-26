import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

export interface SortOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-sort-select',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSelectModule, MatFormFieldModule],
  templateUrl: './sort-select.component.html',
  styleUrl: './sort-select.component.css',
})
export class SortSelectComponent {
  private optionsSignal = signal<SortOption[]>([]);

  @Input() set options(value: SortOption[]) {
    this.optionsSignal.set(value || []);
  }
  get options(): SortOption[] {
    return this.optionsSignal();
  }

  @Input() selectedValue: string = '';
  @Input() label: string = 'Trier par';

  @Output() selectionChange = new EventEmitter<string>();

  onSelectionChange(value: string) {
    this.selectionChange.emit(value);
  }
}
