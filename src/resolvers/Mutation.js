const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { APP_SECRET, getUserId } = require('../utils')

async function post(parent, args, context, info) {
    const userId = getUserId(context)
  
    const newLink = await context.prisma.link.create({
      data: {
        url: args.url,
        description: args.description,
        postedBy: { connect: { id: userId } },
      }
    })
    context.pubsub.publish("NEW_LINK", newLink)
  
    return newLink
  }


async function signup(parent, args, context, info) {
    // Encriptando a senha do usuario, com esse bcryptjs
    const password = await bcrypt.hash(args.password, 10)
  
    // Usando a instancia de 'PrismaClient' pra guardar o novo registro de usuario no banco de dados
    const user = await context.prisma.user.create({ data: { ...args, password } })
  
    // Estamos gerando um token JSON que vai criar o secret pro usuario
    const token = jwt.sign({ userId: user.id }, APP_SECRET)
  
    // Retornamos o token e o usuario no chema do graphql
    return {
      token,
      user,
    }
  }
  
  async function login(parent, args, context, info) {
    // Agora, como é login, nao estamos criando mais registros. Aqui vamos buscar um registro de usuario existente pelo email que foi passado. Se nao tiver email correspondente no banco, retorna que nao existe
    const user = await context.prisma.user.findUnique({ where: { email: args.email } })
    if (!user) {
      throw new Error('No such user found')
    }
  
    // Aqui comparamos a senha passada com a senha de usuario que temos. Se tiver errada, fala que ta errado, senao, entra
    const valid = await bcrypt.compare(args.password, user.password)
    if (!valid) {
      throw new Error('Invalid password')
    }
  
    const token = jwt.sign({ userId: user.id }, APP_SECRET)
  
    // Retornamos no final de tudo o usuario e a senha
    return {
      token,
      user,
    }
  }
  
  module.exports = {
    signup,
    login,
    post,
  }