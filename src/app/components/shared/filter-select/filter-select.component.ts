import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

@Component({
  selector: 'app-filter-select',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSelectModule, MatFormFieldModule],
  templateUrl: './filter-select.component.html',
  styleUrl: './filter-select.component.css',
})
export class FilterSelectComponent {
  private optionsSignal = signal<FilterOption[]>([]);

  @Input() set options(value: FilterOption[]) {
    this.optionsSignal.set(value || []);
  }
  get options(): FilterOption[] {
    return this.optionsSignal();
  }

  @Input() selectedValue: string = '';
  @Input() label: string = 'Filter';
  @Input() showCount: boolean = true;

  @Output() selectionChange = new EventEmitter<string>();

  onSelectionChange(value: string) {
    this.selectionChange.emit(value);
  }

  getDisplayLabel(option: FilterOption): string {
    if (this.showCount && option.count !== undefined) {
      return `${option.label} (${option.count})`;
    }
    return option.label;
  }
}
