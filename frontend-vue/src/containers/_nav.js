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
          unrestricted: true
        },
        {
          _name: 'CSidebarNavItem',
          name: t('graduation.nav.selfRegistration'),
          to: '/graduation/register',
          icon: 'cil-badge'
        },
        {
          _name: 'CSidebarNavItem',
          name: t('graduation.nav.ceremonyPreferences'),
          to: '/graduation/ceremony-preferences',
          icon: 'cil-calendar-check',
          unrestricted: true
        },
        {
          _name: 'CSidebarNavItem',
          name: t('graduation.nav.faceCheckIn'),
          to: '/graduation/face-checkin',
          icon: 'cil-camera',
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
