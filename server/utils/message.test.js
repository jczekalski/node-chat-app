const expect = require('expect');
const { generateMessage } = require('./message');

describe('generateMessage', () => {

  it('should generate the correct message object', () => {

    const text = 'Hi';
    const from = 'Bob';
    const message = generateMessage(from, text);

    expect(message).toInclude({from, text});
    expect(message.createdAt).toExist().toBeA('number');

  });

});
