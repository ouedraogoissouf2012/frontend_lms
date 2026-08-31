const ROLE_STRINGS = new Set([
  'etudiant',
  'étudiant',
  'student',
  'enseignant',
  'teacher',
  'coordinateur',
  'coordinator',
  'admin',
  'administrateur',
  'superAdmin',
  'supradmin',
  'secretaire',
])

function isRoleLiteral(node) {
  return node?.type === 'Literal' && typeof node.value === 'string' && ROLE_STRINGS.has(node.value)
}

function isRoleAccess(node) {
  if (!node) return false
  if (node.type === 'Identifier' && node.name === 'role') return true
  return (
    node.type === 'MemberExpression'
    && !node.computed
    && node.property?.type === 'Identifier'
    && node.property.name === 'role'
  )
}

const MESSAGE = 'Use helpers from @/constants/roles.js instead of a raw role string.'

export default {
  meta: {
    type: 'problem',
    docs: { description: 'Forbid raw role string checks; use roles.js' },
    schema: [],
  },
  create(context) {
    return {
      BinaryExpression(node) {
        if (node.operator !== '===' && node.operator !== '!==') return
        const hit = (isRoleAccess(node.left) && isRoleLiteral(node.right))
          || (isRoleAccess(node.right) && isRoleLiteral(node.left))
        if (hit) context.report({ node, message: MESSAGE })
      },
      CallExpression(node) {
        const callee = node.callee
        if (callee?.type !== 'MemberExpression' || callee.computed) return
        if (callee.property?.name !== 'includes') return
        if (callee.object?.type !== 'ArrayExpression') return
        if (node.arguments.length !== 1 || !isRoleAccess(node.arguments[0])) return
        if (callee.object.elements.some(isRoleLiteral)) {
          context.report({ node, message: MESSAGE })
        }
      },
    }
  },
}
