# shopping-list
A solution to a minor pain in the ass that was reconciling an iCloud reminders shopping list and the Woolworths NZ product locator.

It works by reading out a well known reminders list, mine is called "Shopping", using [reminders-cli](https://github.com/keith/reminders-cli). So long as EventKit can read the incomplete tasks it should work.

Example use of response:

<p align="center">
  <img height="300" alt="An example use as a card in home assistant" src="https://raw.githubusercontent.com/AlexQuinlivan/shopping-list/main/img/ha-card.png" />
  <img height="300" alt="The example json response used to fill the contents of the card" src="https://raw.githubusercontent.com/AlexQuinlivan/shopping-list/main/img/response.png" />
</p>
