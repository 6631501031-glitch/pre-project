export default function buildNav (t) {
  return [
    {
      _name: 'CSidebarNav',
      _children: [
        {
          _name: 'CSidebarNavItem',
          name: t('graduation.nav.selfRegistration'),
          to: '/graduation/register',
          icon: 'cil-badge',
          permission: { path: '/graduation-system-using-face-recognition/registry', action: 'view' }
        },
        {
          _name: 'CSidebarNavItem',
          name: t('graduation.nav.registrationAdmin'),
          to: '/graduation/registrations',
          icon: 'cil-list-rich',
          permission: { path: '/graduation-system-using-face-recognition/registry', action: 'view' }
        },
        {
          _name: 'CSidebarNavItem',
          name: t('graduation.nav.checkinDashboard'),
          to: '/graduation/checkin-dashboard',
          icon: 'cil-calendar-check',
          permission: { path: '/graduation-system-using-face-recognition/registry', action: 'view' }
        }
      ]
    }
  ]
}
