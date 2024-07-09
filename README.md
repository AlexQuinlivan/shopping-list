# shopping-list

shopping-list is a bodged together node/express api designed to bridge the gap between your iCloud Reminders shopping list and the Woolworths NZ product locator. This tool is particularly useful for those who maintain a shopping list in iCloud Reminders and wish to easily locate these items within the Woolworths NZ store. It uses the [reminders-cli](https://github.com/keith/reminders-cli) tool and reads items from a well known reminders list (e.g., "Shopping") and matches them with products available at your local store.

The product locator is pretty hit or miss right now. But this works on a garbage in / garbage out system. The more accurate what you put in your shopping list is, the more accurate what it finds is.

## Prerequisites

Before you begin, ensure you have the following:

- macos 10.15+ with access to iCloud Reminders.
- [reminders-cli](https://github.com/keith/reminders-cli) installed on your Mac. This tool allows the script to read your iCloud Reminders.
- nodejs version as defined in `.tool-versions` (if using a node env manager it should pick this up)
- have cloned this repo

## Setup Instructions

### Step 1: Update .env.default or make your own private one

* Update `STORE_ID` to be the identifier of your local Woolworths store.
* Update `SHOPPING_LIST_NAME` to be the name that your reminders list that you use to put groceries in.
* Update `PORT` if you care to use something else, default is `9090`.

### Step 2: Install reminders-cli and verify it is working

Go to [reminders-cli](https://github.com/keith/reminders-cli) for install instructions. Then when running:
```sh
grep "SHOPPING_LIST_NAME" .env.default | sed 's/SHOPPING_LIST_NAME=//' | xargs -I{} reminders show {}
```
You should either see all incomplete reminders in the configured list

### Step 3: Running the api

1. Run `npm i` to install dependencies
2. Run `npm run migrate` to generate a `reminders.db` sqlite3 file
3. Run `npm start` to begin serving requests
4. Verify installation is correct by requesting `curl http://localhost:9090/api/shopping-list`

### Example Use - Home Assistant

This is all because I want to know exactly where an item on my unordered shopping list is when I'm in store, I hated working through my list and needing to go back to where I've already been. So I use it to serve up a card in home assistant.

<img height="300" alt="An example use as a card in home assistant" src="https://raw.githubusercontent.com/AlexQuinlivan/shopping-list/main/img/ha-card.png" />

If you want to slap something together yourself, here:

#### Step 1: Create a RESTful sensor

```yaml
rest:
  - resource: http://{SERVER_HOST}:9090/api/shopping-list
    method: GET
    headers:
      Content-Type: application/json
    scan_interval: 30
    sensor:
      - name: shopping_list
        unique_id: shopping_list
        value_template: "{{ value_json.results | length }}"
        json_attributes:
          - result
```

#### Step 2: Add a card somewhere

I use a markdown card with some terrible card-mod styling, because I'm lazy and <s>just want it to work</s> want it to just work.

```yaml
type: markdown
content: |
  <h2>Shopping list</h2>

  {% set groups = state_attr('sensor.shopping_list', 'results') %}
  {% for group in groups %}
  ### {{ group.aisle }}
    {% for item in group['items'] %}
      {% if item.image %}
        <div class="container"><img src="{{ item.image }}" /><span>{{ item.name }}</span></div>
      {% else %}
        <div class="container"><p></p><span>{{ item.name }}</span></div>
      {% endif %}
    {% endfor %}
  {% endfor %}
card_mod:
  style:
    ha-markdown$: |
      div {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
      }
      div > img, div > p {
        margin-right: 16px;
      }
      img {
        text-indent: -10000px
      }
      img, p {
        border-radius: 8px;
        width: 48px;
        height: 48px;
        background-color: #36454F;
      }
      p {
        margin-top: 0px !important;
        margin-left: 0px !important;
        margin-bottom: 0px !important;
      }
```

### Troubleshooting
* **reminders-cli Authorization Issues:** Ensure that you've allowed Terminal to access your Reminders in the Mac System Preferences under Security & Privacy.
* **general errors:** Check that your iCloud Reminders list name matches the one specified in the script. Adjust the script if necessary.
