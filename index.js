import { ApolloServer, gql, UserInputError } from "apollo-server";
import { v1 as uuid } from "uuid";
import axios from 'axios'


/*
***** Importante! *****
Para el ultimo ejemplo resolvers -> allPersons() los datos se cargan desde db.json
*/
//-----------------------------------------------------------------------------------
//Carga de datos
const persons = [
    {
        name: "Roberto",
        phone: "654321654",
        street: "Isabel Clara...",
        city: "Madrid",
        id: "1"
    },
    {
        name: "Svetlana",
        phone: "789456123",
        street: "Kiev",
        city: "Moscow",
        id: "2"
    },
    {
        name: "Ramon",
        phone: "987654321",
        street: "Madrid",
        city: "Salvador",
        id: "3"
    }
]

//Define que tiene cada persona, definicion de datos
const typeDefs = gql`

    enum YesNo{
        Yes
        No
    }

    type Adress{
        street: String!
        city: String!
    }
    type Person{
        name: String!
        phone: String
        adress: Adress!
        id: ID!
    }

    type Query{
        personCount: Int!
        allPersons (phone: YesNo) : [Person]!
        findPerson(name:String!): Person
    }

    type Mutation{
        addPerson(
            name: String!
            phone: String
            street: String!
            city: String!
        ): Person

        editNumber(
            name: String!
            phone: String
        ):Person
    }
`
//Define las consultas y como se gestionan
const resolvers = {
    Query: {
        personCount: () => persons.length,
        allPersons: async (root, args) => {
            const { data: personsFromRestAPI } = await axios.get('http://localhost:3000/persons')
            console.log(personsFromRestAPI)


            if (!args.phone) return personsFromRestAPI

            return personsFromRestAPI.filter(person => {
                return args.phone == "Yes" ? person.phone : !person.phone
            })
        },
        findPerson: (root, args) => {
            const { name } = args
            return personsFromRestAPI.find(person => person.name == name)
        }
    },
    Mutation: {
        addPerson: (root, args) => {
            if (persons.find(p => p.name == args.name)) {
                throw new UserInputError("Name must be unique", {
                    invalidArgs: args.name
                })
            }
            //const { name, phone, street, city } == args
            const person = { ...args, id: uuid() }//... == spread(coge todos los args)
            persons.push(person) //Actualizar la base de datos con nueva persona
            return person
        },
        editNumber: (root, args) => {
            const personIndex = persons.findIndex(p => p.name === args.name)
            if (personIndex === -1) return null

            const person = persons[personIndex]

            const updatePerson = { ...person, phone: args.phone }

            persons[personIndex] = updatePerson

            return updatePerson

        }
    },
    //Es posible definir datos a partir de otros campos.
    Person: {
        adress: (root) => {
            return {
                street: (root.street),
                city: (root.city)
            }
        }
    }
}

//Creamos servidor
const server = new ApolloServer({
    typeDefs, resolvers
})

//Se inicia el server
server.listen().then(({ url }) => {
    console.log(`Server ready at ${url}`)
})
