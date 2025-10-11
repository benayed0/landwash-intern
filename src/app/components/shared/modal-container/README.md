# Modal Container Component

A bulletproof, reusable modal container component that ensures perfect centering and viewport positioning regardless of parent scroll position.

## Features

- ✅ **Always centered** - Uses `position: fixed` with 100vh/100vw viewport units
- ✅ **Scroll-independent** - Modal stays centered even when page is scrolled
- ✅ **Responsive** - Adapts to different screen sizes automatically
- ✅ **Customizable sizes** - Small, medium, large, or auto sizing
- ✅ **Keyboard support** - ESC key closes the modal
- ✅ **Click-outside handling** - Optional overlay click to close
- ✅ **Smooth animations** - Fade-in and slide-up effects
- ✅ **Mobile-friendly** - Optimized for mobile devices

## Usage

### Basic Example

```html
<app-modal-container
  [show]="showModal"
  [size]="'medium'"
  [closeOnOverlayClick]="true"
  (close)="onCloseModal()"
>
  <div class="modal-inner">
    <h2>Modal Title</h2>
    <p>Modal content goes here...</p>
    <button (click)="onCloseModal()">Close</button>
  </div>
</app-modal-container>
```

### Component Setup

1. **Import the component** in your standalone component or module:

```typescript
import { ModalContainerComponent } from '../shared/modal-container/modal-container.component';

@Component({
  selector: 'app-your-component',
  standalone: true,
  imports: [CommonModule, ModalContainerComponent],
  // ...
})
```

2. **Add a boolean flag** to control modal visibility:

```typescript
export class YourComponent {
  showModal = false;

  openModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }
}
```

3. **Use the modal container** in your template:

```html
<button (click)="openModal()">Open Modal</button>

<app-modal-container
  [show]="showModal"
  [size]="'medium'"
  (close)="closeModal()"
>
  <!-- Your modal content here -->
  <div class="your-modal-content">
    <h3>Your Modal Title</h3>
    <p>Your content...</p>
  </div>
</app-modal-container>
```

## Input Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `show` | `boolean` | `false` | Controls modal visibility |
| `size` | `'small' \| 'medium' \| 'large' \| 'auto'` | `'auto'` | Sets the modal width |
| `closeOnOverlayClick` | `boolean` | `true` | Allow closing by clicking outside |
| `showCloseButton` | `boolean` | `false` | Show built-in close button |

## Output Events

| Event | Type | Description |
|-------|------|-------------|
| `close` | `EventEmitter<void>` | Emitted when modal should close |

## Size Options

- **small**: Max width 400px - Best for simple confirmations
- **medium**: Max width 600px - Default for most modals
- **large**: Max width 900px - For complex forms or data
- **auto**: Width adapts to content (min 300px)

## Examples

### Confirmation Dialog (Small)

```html
<app-modal-container
  [show]="showConfirm"
  [size]="'small'"
  [closeOnOverlayClick]="false"
  (close)="onCancel()"
>
  <div class="confirm-dialog">
    <h3>Confirm Action</h3>
    <p>Are you sure you want to proceed?</p>
    <div class="actions">
      <button (click)="onCancel()">Cancel</button>
      <button (click)="onConfirm()">Confirm</button>
    </div>
  </div>
</app-modal-container>
```

### Form Modal (Medium)

```html
<app-modal-container
  [show]="showForm"
  [size]="'medium'"
  (close)="closeForm()"
>
  <div class="form-modal">
    <h2>Edit Details</h2>
    <form (ngSubmit)="onSubmit()">
      <input type="text" [(ngModel)]="name" />
      <button type="submit">Save</button>
    </form>
  </div>
</app-modal-container>
```

### Complex Modal (Large)

```html
<app-modal-container
  [show]="showDetails"
  [size]="'large'"
  [showCloseButton]="true"
  (close)="closeDetails()"
>
  <div class="details-modal">
    <h2>Detailed View</h2>
    <!-- Complex content with tables, charts, etc. -->
  </div>
</app-modal-container>
```

## Styling Your Modal Content

The modal container provides the overlay and centering. You style your inner content:

```css
.your-modal-content {
  background: white;
  padding: 24px;
  /* Border radius is handled by modal-container */
}

/* For dark theme */
.modal-inner {
  background: #1a1a1a;
  color: #e5e5e5;
  border: 1px solid #3a3a3a;
}
```

## Accessibility

- Press **ESC** to close the modal
- Focus trap is recommended for complex modals
- Use semantic HTML inside your modal content
- Add `aria-label` or `aria-labelledby` to modal content

## Migration from Old Modals

**Before:**
```html
@if (showModal) {
<div class="modal-overlay" (click)="closeModal()">
  <div class="modal-content" (click)="$event.stopPropagation()">
    <!-- content -->
  </div>
</div>
}
```

**After:**
```html
<app-modal-container
  [show]="showModal"
  [size]="'medium'"
  (close)="closeModal()"
>
  <div class="modal-inner">
    <!-- content -->
  </div>
</app-modal-container>
```

Remove the old `.modal-overlay` CSS and keep only your content styles.

## Real-World Examples in Codebase

- **booking-card.component.html** - Delay modal
- **booking-list.component.html** - Multiple modals (price, team, reject, create)
