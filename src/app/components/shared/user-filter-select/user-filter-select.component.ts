import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';

export interface UserFilterOption {
  _id: string;
  name?: string;
  email: string;
  phoneNumber?: string;
}

@Component({
  selector: 'app-user-filter-select',
  standalone: true,
  imports: [CommonModule, MatSelectModule, MatFormFieldModule, MatIconModule],
  templateUrl: './user-filter-select.component.html',
  styleUrl: './user-filter-select.component.css',
})
export class UserFilterSelectComponent {
  private usersSignal = signal<UserFilterOption[]>([]);

  @Input() set users(value: UserFilterOption[]) {
    console.log('UserFilterSelect received users:', value);
    this.usersSignal.set(value || []);
  }
  get users(): UserFilterOption[] {
    return this.usersSignal();
  }

  @Input() selectedUserId: string = 'all';
  @Input() label: string = 'Filtrer par client';
  @Input() placeholder: string = 'Rechercher un client...';
  @Input() showEmail: boolean = false;
  @Input() showPhoneNumber: boolean = true;
  @Input() allUsers: boolean = true;

  @Output() selectionChange = new EventEmitter<string>();

  searchTerm = signal<string>('');

  filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const allUsers = this.usersSignal();

    if (!term) return allUsers;

    return allUsers.filter((user) => {
      const matchesName = user.name?.toLowerCase().includes(term);
      const matchesPhone =
        user.phoneNumber && user.phoneNumber?.toLowerCase().includes(term);
      const matchesEmail =
        user.email && user.email.toLowerCase().includes(term);

      return matchesName || matchesPhone || matchesEmail;
    });
  });

  onSelectionChange(value: string) {
    this.selectionChange.emit(value);
  }

  getSelectedUserName(): string {
    if (this.selectedUserId === 'all') return 'Tous les clients';

    const user = this.users.find((u) => u._id === this.selectedUserId);
    return user ? (user.name ? user.name : 'Pas de  nom') : 'Client inconnu';
  }

  getUserDisplayText(user: UserFilterOption): string {
    let displayText = '';
    const name = user.name || 'Pas de nom';
    displayText += name;
    if (this.showEmail && user.email) {
      displayText += ` - ${user.email}`;
    }
    if (this.showPhoneNumber && user.phoneNumber) {
      displayText += ` - ${user.phoneNumber}`;
    }
    return displayText;
  }
}
