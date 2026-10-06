export default function buildNav (t) {
  return [
    {
      _name: 'CSidebarNav',
      _children: [
        {
          _name: 'CSidebarNavItem',
          name: t('graduation.nav.questionnaire'),
          to: '/graduation/questionnaire/form',
          icon: 'cil-list',
          unrestricted: true,
          studentOnly: true
        },
        {
          _name: 'CSidebarNavItem',
          name: t('graduation.nav.selfRegistration'),
          to: '/graduation/register',
          icon: 'cil-badge',
          unrestricted: true,
          studentOnly: true
        },
        {
          _name: 'CSidebarNavItem',
          name: t('graduation.nav.ceremonyPreferences'),
          to: '/graduation/ceremony-preferences',
          icon: 'cil-calendar-check',
          unrestricted: true,
          studentOnly: true
        },
        {
          _name: 'CSidebarNavItem',
          name: t('graduation.nav.faceCheckIn'),
          to: '/graduation/face-checkin',
          icon: 'cil-camera',
          unrestricted: true,
          studentOnly: true
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
        },
        {
          _name: 'CSidebarNavItem',
          name: t('automaticCheckin.title'),
          to: '/graduation/admin-face-scanner',
          icon: 'cil-camera',
          unrestricted: true,
          adminOnly: true
        },
        {
          _name: 'CSidebarNavTitle',
          name: 'Administration'
        },
        {
          _name: 'CSidebarNavItem',
          name: t('nav.accountDirectory'),
          to: '/accounts/directory',
          icon: 'cil-people',
          unrestricted: true,
          adminOnly: true,
          permission: { path: '/accounts/directory', action: 'view' }
        },
        {
          _name: 'CSidebarNavItem',
          name: t('nav.permissionMatrix'),
          to: '/security/permissions/matrix',
          icon: 'cil-shield-alt',
          unrestricted: true,
          adminOnly: true,
          permission: { path: '/security/permissions/matrix', action: 'view' }
        },
      ]
    }
  ]
}
