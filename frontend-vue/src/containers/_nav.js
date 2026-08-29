export default function buildNav (t) {
  return [
    {
      _name: 'CSidebarNav',
      _children: [
        {
          _name: 'CSidebarNavItem',
          name: 'แดชบอร์ด',
          to: '/dashboard',
          icon: 'cil-speedometer',
          unrestricted: true
        },
        {
          _name: 'CSidebarNavItem',
          name: t('graduation.nav.registrationAdmin'),
          to: '/graduation/registrations',
          icon: 'cil-list-rich',
          unrestricted: true,
          adminOnly: true
        },
        {
          _name: 'CSidebarNavItem',
          name: t('graduation.nav.checkinDashboard'),
          to: '/graduation/checkin-dashboard',
          icon: 'cil-calendar-check',
          unrestricted: true,
          adminOnly: true
        }
      ]
    }
  ]
}
