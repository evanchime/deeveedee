# Deeveedee

Welcome to Deeveedee. I Dey Play I Dey Show! This project aims to create a AI chat bot application on WhatsApp..

## Table of Contents

- [Getting Started with WhatsApp Business Cloud API](#getting-started-with-whatsapp-business-cloud-api)
- [Installation](#installation)
- [Usage](#usage)
- [How to Set Up the Webhook](#how-to-set-up-the-webhook) 
- [Contributing](#contributing)
- [License](#license)

## Getting Started with WhatsApp Business Cloud API
First, open the WhatsApp Business Platform Cloud API Get Started Guide and follow the first four steps to:

1.  Add the WhatsApp product to your business app;
2.  Add a recipient number;
3.  Send a test message;
4.  Configure a webhook to receive real time HTTP notifications. For this step, follow [How to Set Up the Webhook](#how-to-set-up-the-webhook) below

For the last step, you need to further follow the Sample Callback URL for Webhooks Testing Guide to create a free account on glitch.com to get your webhook's callback URL.

Now open the Meta for Develops Apps page and select the WhatsApp business app and you should be able to copy the curl command (as shown in the App Dashboard - WhatsApp - API Setup - Step 2 below) and run the command on a Terminal to send a test message to your WhatsApp.

Note down the "Temporary access token", "Phone number ID", and "a recipient phone number" in the API Setup page above, which will be used later.

## Installation

1. Clone the repository.
2. Install the required dependencies by running the following command:

    ```shell
    npm install
    ```

## Usage

1. Modify the code in the `index.js` file according to your needs.
2. Run the project using the following command:

    ```shell
    node index.js
    ```
## How to Set Up the Webhook

1.  In your developer account on Meta for Developers, click the Configuration menu under WhatsApp in the left navigation pane.
2.  In the Webhook card, click Edit.
3.  Then, in the Callback URL field of the dialog that opens, paste the copied URL from [Getting Started with WhatsApp Business Cloud API](#getting-started-with-whatsapp-business-cloud-api), and append /webhook to it.
4.  Add the meta token into the Verify token field. Click Verify and save to close the dialog.
5.  Now, from the same card, click Manage and check the messages field. The webhook is now ready

## Contributing

Contributions are welcome! If you find any issues or have suggestions, please open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE.md)