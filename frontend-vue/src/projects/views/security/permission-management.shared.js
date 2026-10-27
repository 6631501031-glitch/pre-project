const ACTIONS = ['view', 'edit', 'delete', 'action']

export function hasActiveAssignment (accountId, assignments) {
  return (Array.isArray(assignments) ? assignments : []).some(item =>
    String(item && item.accountId || '') === String(accountId || '') && item.active !== false
  )
}

export function getPermissionValues (permission) {
  const row = permission || {}
  const all = !!row.all
  return {
    view: all || !!row.view,
    edit: all || !!row.edit,
    delete: all || !!row.delete,
    action: all || !!row.action
  }
}

export function buildGroupPermissionChanges (menus, permissions, groupId, draft) {
  const currentPermissions = Array.isArray(permissions) ? permissions : []
  const menuItems = Array.isArray(menus) ? menus : []
  const creates = []
  const updates = []

  menuItems.forEach(menu => {
    const menuId = String(menu && menu._id || '')
    const values = draft && draft[menuId]
    if (!menuId || !values) return

    const original = currentPermissions.find(item =>
      String(item && item.groupId || '') === String(groupId || '') &&
      String(item && item.menuId || '') === menuId
    )
    const previous = getPermissionValues(original)
    const changed = ACTIONS.some(action => !!values[action] !== previous[action])
    if (!changed) return

    const payload = {
      group: groupId,
      menu: menuId,
      all: false,
      view: !!values.view,
      edit: !!values.edit,
      delete: !!values.delete,
      action: !!values.action,
      logs: !!(original && (original.logs || original.all))
    }

    if (original && original._id) {
      payload._id = original._id
      updates.push(payload)
    } else if (ACTIONS.some(action => payload[action])) {
      creates.push(payload)
    }
  })

  return { creates, updates }
}
