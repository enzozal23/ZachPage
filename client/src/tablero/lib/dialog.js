import Swal from 'sweetalert2'

export function confirmDialog({
  title,
  text,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
}) {
  const dark = document.documentElement.classList.contains('dark')
  return Swal.fire({
    title,
    text,
    icon: 'warning',
    theme: dark ? 'dark' : 'light',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    focusCancel: true,
  }).then((result) => result.isConfirmed)
}
