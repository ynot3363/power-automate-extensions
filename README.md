# Power Automate Extensions Azure Functions

This repository contains a collection of Azure Functions designed to extend the capabilities of Power Automate by providing custom endpoints for data manipulation and processing. These functions can be imported into Power Automate as custom connectors to perform various tasks such as flattening arrays, sorting data, grouping objects, calculating differences between arrays, extracting files from ZIP archives, mapping arrays by a property, and more.

## Features

- createMapFromArray: Creates a map (key/value pair object) from an array of objects based on a specified nested property.
- diffArrays: Compares two arrays and returns items unique to each.
- extractZipFiles: Extracts files from a Base64-encoded ZIP file and returns each file’s name, content type, and content.
- flattenArray: Flattens a nested array into a single-level array.
- groupArrayBy: Groups an array of objects based on a specified (even nested) property.
- sortArray: Sorts an array using different sorting modes (numeric, lexicographical, or date).

## Prerequisites

- Node.js (v20 or later recommended)
- TypeScript (if you plan to modify the functions)
- Azure Functions Core Tools (for local development and testing)
- Azurite (for local development and testing)
- An active Azure Subscription (for deployment)
- Familiarity with Power Automate custom connectors if you plan to integrate these endpoints into your flows

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/ynot3363/power-automate-extensions.git
cd power-automate-extensions
```

### 2. Install Dependencies

Use npm or yarn to install required packages:

```bash
npm install
```

### 3. Build the Project

If using TypeScript, compile the code:

```bash
npm run build
```

Ensure your `tsconfig.json` is correctly configured.

### 4. Test Locally

Run the Azure Functions locally using the Azure Functions Core Tools:

```bash
func start
```

Test the individual endpoints with a tool like Postman or via the integrated test environment.

### 5. Deploy to Azure

You can deploy your functions directly from Visual Studio Code or using the Azure CLI:

- Using Visual Studio Code:
  Open the project folder in VS Code, then use the Azure Functions extension to deploy your function app.

- Using Azure CLI:

```bash
func azure functionapp publish <YourFunctionAppName>
```

## Custom Connectors in Power Automate

Each Azure Function can be exposed as an operation in a custom connector for Power Automate. To create a custom connector:

1. Import the `apiDefinition-swagger.json` file into Power Automate or the Power Platform custom connector editor.
2. Configure OAuth 2.0 or any other authentication if required.
3. Test the custom connector using sample flows.

Refer to [Microsoft’s documentation for custom connectors](https://learn.microsoft.com/en-us/connectors/custom-connectors) for detailed guidance.

## License

This project is licensed under the GNU Affero General Public License v3 (GNU AGPLv3). See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Feel free to fork this repository and submit pull requests. Please ensure that your changes are covered by tests and conform to the existing coding standards.

## Support

For any questions or issues, please open an issue in this repository.

## Acknowledgements

- [Azure Functions Documentation](https://learn.microsoft.com/en-us/azure/azure-functions/)
- [Power Automate Custom Connectors Documentation](https://learn.microsoft.com/en-us/connectors/custom-connectors/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [GNU AGPLv3 License](https://www.gnu.org/licenses/agpl-3.0.html)
