const expect = require('expect');
const { Users } = require('./users');

describe('Users', () => {
  let users;

  beforeEach(() => {
    users = new Users();
    users.users = [{
      id: '1',
      name: 'Mike',
      room: 'Node Course'
    }, {
        id: '2',
        name: 'Jen',
        room: 'React Course'
      }, {
        id: '3',
        name: 'Julie',
        room: 'Node Course'
      }];
  });

  it('should add new user', () => {
    const users = new Users();
    const user = {
      id: '123',
      name: 'Bob',
      room: 'Room 1'
    };

    const resUser = users.addUser(user.id, user.name, user.room);
    expect(users.users).toEqual([user]);
  });

  it('should remove a user', () => {
    const id = '2';
    const user = users.removeUser(id);
    expect(user.id).toBe(id);
    expect(users.users.length).toBe(2);
  });

  it('should not remove user', () => {
    const id = '99';
    const user = users.removeUser(id);
    expect(user).toNotExist();
    expect(users.users.length).toBe(3);
  });

  it('should find user', () => {
    const id = '1';
    const user = users.getUser(id);
    expect(user.id).toBe(id);
  });

  it('should not find user', () => {
    const id = '4';
    const user = users.getUser(id);
    expect(user).toNotExist();
  });

  it('should return names for Node Course room', () => {
    const userList = users.getUserList('Node Course');
    expect(userList).toEqual(['Mike', 'Julie']);
  });

  it('should return names for React Course room', () => {
    const userList = users.getUserList('React Course');
    expect(userList).toEqual(['Jen']);
  });

});