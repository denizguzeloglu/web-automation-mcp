#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import puppeteer, { Browser, Page } from 'puppeteer';

class WebAutomationServer {
  private server: Server;
  private browser: Browser | null = null;
  private pages: Map<string, Page> = new Map();
  private currentPage: Page | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'web-automation-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'launch_browser',
          description: 'Launch a new browser instance',
          inputSchema: {
            type: 'object',
            properties: {
              headless: {
                type: 'boolean',
                description: 'Run in headless mode',
                default: false,
              },
              viewport_width: {
                type: 'number',
                default: 1920,
              },
              viewport_height: {
                type: 'number',
                default: 1080,
              },
            },
          },
        },
        {
          name: 'close_browser',
          description: 'Close the browser',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'navigate',
          description: 'Navigate to a URL',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'The URL to navigate to',
              },
              wait_until: {
                type: 'string',
                enum: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2'],
                default: 'networkidle2',
              },
            },
            required: ['url'],
          },
        },
        {
          name: 'click',
          description: 'Click an element',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS selector of element to click',
              },
              click_count: {
                type: 'number',
                default: 1,
              },
              delay: {
                type: 'number',
                default: 0,
              },
            },
            required: ['selector'],
          },
        },
        {
          name: 'type_text',
          description: 'Type text into an input field',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS selector of input field',
              },
              text: {
                type: 'string',
                description: 'Text to type',
              },
              clear_first: {
                type: 'boolean',
                default: false,
              },
              delay: {
                type: 'number',
                default: 0,
              },
            },
            required: ['selector', 'text'],
          },
        },
        {
          name: 'get_text',
          description: 'Get text content from elements',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS selector',
              },
              all: {
                type: 'boolean',
                description: 'Get all matching elements',
                default: false,
              },
            },
            required: ['selector'],
          },
        },
        {
          name: 'take_screenshot',
          description: 'Take a screenshot',
          inputSchema: {
            type: 'object',
            properties: {
              filename: {
                type: 'string',
                description: 'File name to save screenshot',
              },
              full_page: {
                type: 'boolean',
                default: false,
              },
              selector: {
                type: 'string',
                description: 'CSS selector to screenshot specific element',
              },
            },
            required: ['filename'],
          },
        },
        {
          name: 'wait_for_element',
          description: 'Wait for an element to appear',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
                description: 'CSS selector to wait for',
              },
              timeout: {
                type: 'number',
                default: 30000,
              },
            },
            required: ['selector'],
          },
        },
        {
          name: 'execute_javascript',
          description: 'Execute custom JavaScript in the page',
          inputSchema: {
            type: 'object',
            properties: {
              script: {
                type: 'string',
                description: 'JavaScript code to execute',
              },
            },
            required: ['script'],
          },
        },
        {
          name: 'go_back',
          description: 'Go back in browser history',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'go_forward',
          description: 'Go forward in browser history',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'refresh',
          description: 'Refresh the current page',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get_page_content',
          description: 'Get the entire page HTML content',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'select_option',
          description: 'Select an option from a dropdown',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
              },
              value: {
                type: 'string',
              },
            },
            required: ['selector', 'value'],
          },
        },
        {
          name: 'hover',
          description: 'Hover over an element',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
              },
            },
            required: ['selector'],
          },
        },
        {
          name: 'press_key',
          description: 'Press a keyboard key',
          inputSchema: {
            type: 'object',
            properties: {
              key: {
                type: 'string',
              },
            },
            required: ['key'],
          },
        },
        {
          name: 'scroll',
          description: 'Scroll the page',
          inputSchema: {
            type: 'object',
            properties: {
              direction: {
                type: 'string',
                enum: ['up', 'down', 'top', 'bottom'],
              },
              amount: {
                type: 'number',
              },
            },
          },
        },
        {
          name: 'wait',
          description: 'Wait for a specified duration',
          inputSchema: {
            type: 'object',
            properties: {
              duration: {
                type: 'number',
                description: 'Duration in milliseconds',
              },
            },
            required: ['duration'],
          },
        },
        {
          name: 'get_cookies',
          description: 'Get cookies from current page',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'set_cookie',
          description: 'Set a cookie',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
              value: {
                type: 'string',
              },
              domain: {
                type: 'string',
              },
            },
            required: ['name', 'value'],
          },
        },
        {
          name: 'clear_cookies',
          description: 'Clear all cookies',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'new_tab',
          description: 'Open a new tab',
          inputSchema: {
            type: 'object',
            properties: {
              tab_id: {
                type: 'string',
              },
              url: {
                type: 'string',
              },
            },
          },
        },
        {
          name: 'switch_tab',
          description: 'Switch to a different tab',
          inputSchema: {
            type: 'object',
            properties: {
              tab_id: {
                type: 'string',
              },
            },
            required: ['tab_id'],
          },
        },
        {
          name: 'close_tab',
          description: 'Close a tab',
          inputSchema: {
            type: 'object',
            properties: {
              tab_id: {
                type: 'string',
              },
            },
          },
        },
        {
          name: 'fill_form',
          description: 'Fill multiple form fields at once',
          inputSchema: {
            type: 'object',
            properties: {
              fields: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    selector: {
                      type: 'string',
                    },
                    value: {
                      type: 'string',
                    },
                    type: {
                      type: 'string',
                      enum: ['text', 'select', 'checkbox', 'radio'],
                    },
                  },
                },
              },
            },
            required: ['fields'],
          },
        },
        {
          name: 'extract_links',
          description: 'Extract all links from the page',
          inputSchema: {
            type: 'object',
            properties: {
              filter: {
                type: 'string',
              },
            },
          },
        },
        {
          name: 'extract_table',
          description: 'Extract data from a table',
          inputSchema: {
            type: 'object',
            properties: {
              selector: {
                type: 'string',
              },
              include_headers: {
                type: 'boolean',
                default: true,
              },
            },
            required: ['selector'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'launch_browser':
            return await this.launchBrowser(args);
          case 'close_browser':
            return await this.closeBrowser();
          case 'navigate':
            return await this.navigate(args);
          case 'click':
            return await this.click(args);
          case 'type_text':
            return await this.typeText(args);
          case 'get_text':
            return await this.getText(args);
          case 'take_screenshot':
            return await this.takeScreenshot(args);
          case 'wait_for_element':
            return await this.waitForElement(args);
          case 'execute_javascript':
            return await this.executeJavaScript(args);
          case 'go_back':
            return await this.goBack();
          case 'go_forward':
            return await this.goForward();
          case 'refresh':
            return await this.refresh();
          case 'get_page_content':
            return await this.getPageContent();
          case 'select_option':
            return await this.selectOption(args);
          case 'hover':
            return await this.hover(args);
          case 'press_key':
            return await this.pressKey(args);
          case 'scroll':
            return await this.scroll(args);
          case 'wait':
            return await this.wait(args);
          case 'get_cookies':
            return await this.getCookies();
          case 'set_cookie':
            return await this.setCookie(args);
          case 'clear_cookies':
            return await this.clearCookies();
          case 'new_tab':
            return await this.newTab(args);
          case 'switch_tab':
            return await this.switchTab(args);
          case 'close_tab':
            return await this.closeTab(args);
          case 'fill_form':
            return await this.fillForm(args);
          case 'extract_links':
            return await this.extractLinks(args);
          case 'extract_table':
            return await this.extractTable(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  private async launchBrowser(args: any) {
    if (this.browser) {
      return {
        content: [{ type: 'text', text: 'Browser is already running' }],
      };
    }

    this.browser = await puppeteer.launch({
      headless: args.headless ?? false,
      defaultViewport: {
        width: args.viewport_width ?? 1920,
        height: args.viewport_height ?? 1080,
      },
    });

    this.currentPage = await this.browser.newPage();
    this.pages.set('main', this.currentPage);

    return {
      content: [{ type: 'text', text: 'Browser launched successfully' }],
    };
  }

  private async closeBrowser() {
    if (!this.browser) {
      return {
        content: [{ type: 'text', text: 'No browser is running' }],
      };
    }

    await this.browser.close();
    this.browser = null;
    this.currentPage = null;
    this.pages.clear();

    return {
      content: [{ type: 'text', text: 'Browser closed successfully' }],
    };
  }

  private async navigate(args: any) {
    const page = await this.getCurrentPage();
    await page.goto(args.url, {
      waitUntil: args.wait_until || 'networkidle2',
    });

    return {
      content: [{ type: 'text', text: `Navigated to ${args.url}` }],
    };
  }

  private async click(args: any) {
    const page = await this.getCurrentPage();
    await page.click(args.selector, {
      clickCount: args.click_count || 1,
      delay: args.delay || 0,
    });

    return {
      content: [{ type: 'text', text: `Clicked ${args.selector}` }],
    };
  }

  private async typeText(args: any) {
    const page = await this.getCurrentPage();
    
    if (args.clear_first) {
      await page.click(args.selector, { clickCount: 3 });
    }

    await page.type(args.selector, args.text, {
      delay: args.delay || 0,
    });

    return {
      content: [{ type: 'text', text: `Typed text into ${args.selector}` }],
    };
  }

  private async getText(args: any) {
    const page = await this.getCurrentPage();
    
    if (args.all) {
      const texts = await page.$$eval(args.selector, (elements) =>
        elements.map((el) => el.textContent?.trim() || '')
      );
      return {
        content: [{ type: 'text', text: JSON.stringify(texts, null, 2) }],
      };
    } else {
      const text = await page.$eval(
        args.selector,
        (el) => el.textContent?.trim() || ''
      );
      return {
        content: [{ type: 'text', text }],
      };
    }
  }

  private async takeScreenshot(args: any) {
    const page = await this.getCurrentPage();
    
    if (args.selector) {
      const element = await page.$(args.selector);
      if (element) {
        await element.screenshot({ path: args.filename });
      }
    } else {
      await page.screenshot({
        path: args.filename,
        fullPage: args.full_page || false,
      });
    }

    return {
      content: [{ type: 'text', text: `Screenshot saved to ${args.filename}` }],
    };
  }

  private async waitForElement(args: any) {
    const page = await this.getCurrentPage();
    await page.waitForSelector(args.selector, {
      timeout: args.timeout || 30000,
    });

    return {
      content: [{ type: 'text', text: `Element ${args.selector} appeared` }],
    };
  }

  private async executeJavaScript(args: any) {
    const page = await this.getCurrentPage();
    const result = await page.evaluate(args.script);

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  }

  private async goBack() {
    const page = await this.getCurrentPage();
    await page.goBack();

    return {
      content: [{ type: 'text', text: 'Navigated back' }],
    };
  }

  private async goForward() {
    const page = await this.getCurrentPage();
    await page.goForward();

    return {
      content: [{ type: 'text', text: 'Navigated forward' }],
    };
  }

  private async refresh() {
    const page = await this.getCurrentPage();
    await page.reload();

    return {
      content: [{ type: 'text', text: 'Page refreshed' }],
    };
  }

  private async getPageContent() {
    const page = await this.getCurrentPage();
    const content = await page.content();

    return {
      content: [{ type: 'text', text: content }],
    };
  }

  private async selectOption(args: any) {
    const page = await this.getCurrentPage();
    await page.select(args.selector, args.value);

    return {
      content: [{ type: 'text', text: `Selected ${args.value} in ${args.selector}` }],
    };
  }

  private async hover(args: any) {
    const page = await this.getCurrentPage();
    await page.hover(args.selector);

    return {
      content: [{ type: 'text', text: `Hovered over ${args.selector}` }],
    };
  }

  private async pressKey(args: any) {
    const page = await this.getCurrentPage();
    await page.keyboard.press(args.key);

    return {
      content: [{ type: 'text', text: `Pressed ${args.key}` }],
    };
  }

  private async scroll(args: any) {
    const page = await this.getCurrentPage();
    
    if (args.direction === 'top') {
      await page.evaluate(() => window.scrollTo(0, 0));
    } else if (args.direction === 'bottom') {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    } else if (args.direction === 'down' && args.amount) {
      await page.evaluate((amount) => window.scrollBy(0, amount), args.amount);
    } else if (args.direction === 'up' && args.amount) {
      await page.evaluate((amount) => window.scrollBy(0, -amount), args.amount);
    }

    return {
      content: [{ type: 'text', text: `Scrolled ${args.direction}` }],
    };
  }

  private async wait(args: any) {
    await new Promise((resolve) => setTimeout(resolve, args.duration));

    return {
      content: [{ type: 'text', text: `Waited ${args.duration}ms` }],
    };
  }

  private async getCookies() {
    const page = await this.getCurrentPage();
    const cookies = await page.cookies();

    return {
      content: [{ type: 'text', text: JSON.stringify(cookies, null, 2) }],
    };
  }

  private async setCookie(args: any) {
    const page = await this.getCurrentPage();
    await page.setCookie({
      name: args.name,
      value: args.value,
      domain: args.domain,
    });

    return {
      content: [{ type: 'text', text: `Cookie ${args.name} set` }],
    };
  }

  private async clearCookies() {
    const page = await this.getCurrentPage();
    const client = await page.createCDPSession();
    await client.send('Network.clearBrowserCookies');

    return {
      content: [{ type: 'text', text: 'All cookies cleared' }],
    };
  }

  private async newTab(args: any) {
    if (!this.browser) {
      throw new Error('No browser is running');
    }

    const newPage = await this.browser.newPage();
    const tabId = args.tab_id || `tab_${Date.now()}`;
    this.pages.set(tabId, newPage);

    if (args.url) {
      await newPage.goto(args.url);
    }

    return {
      content: [{ type: 'text', text: `New tab opened with ID: ${tabId}` }],
    };
  }

  private async switchTab(args: any) {
    const page = this.pages.get(args.tab_id);
    if (!page) {
      throw new Error(`Tab ${args.tab_id} not found`);
    }

    this.currentPage = page;
    await page.bringToFront();

    return {
      content: [{ type: 'text', text: `Switched to tab ${args.tab_id}` }],
    };
  }

  private async closeTab(args: any) {
    const tabId = args.tab_id || 'main';
    const page = this.pages.get(tabId);
    
    if (!page) {
      throw new Error(`Tab ${tabId} not found`);
    }

    await page.close();
    this.pages.delete(tabId);

    if (this.currentPage === page) {
      this.currentPage = this.pages.values().next().value || null;
    }

    return {
      content: [{ type: 'text', text: `Tab ${tabId} closed` }],
    };
  }

  private async fillForm(args: any) {
    const page = await this.getCurrentPage();
    
    for (const field of args.fields) {
      switch (field.type) {
        case 'text':
          await page.type(field.selector, field.value);
          break;
        case 'select':
          await page.select(field.selector, field.value);
          break;
        case 'checkbox':
          if (field.value === 'true') {
            await page.check(field.selector);
          } else {
            await page.uncheck(field.selector);
          }
          break;
        case 'radio':
          await page.click(field.selector);
          break;
      }
    }

    return {
      content: [{ type: 'text', text: 'Form filled successfully' }],
    };
  }

  private async extractLinks(args: any) {
    const page = await this.getCurrentPage();
    
    const links = await page.evaluate((filter) => {
      const anchors = Array.from(document.querySelectorAll('a'));
      return anchors
        .map((a) => ({
          text: a.textContent?.trim() || '',
          href: a.href,
        }))
        .filter((link) =>
          filter ? link.href.includes(filter) || link.text.includes(filter) : true
        );
    }, args.filter);

    return {
      content: [{ type: 'text', text: JSON.stringify(links, null, 2) }],
    };
  }

  private async extractTable(args: any) {
    const page = await this.getCurrentPage();
    
    const tableData = await page.evaluate((selector, includeHeaders) => {
      const table = document.querySelector(selector);
      if (!table) return null;

      const data: string[][] = [];
      
      if (includeHeaders) {
        const headers = Array.from(table.querySelectorAll('th')).map(
          (th) => th.textContent?.trim() || ''
        );
        if (headers.length > 0) {
          data.push(headers);
        }
      }

      const rows = Array.from(table.querySelectorAll('tr'));
      for (const row of rows) {
        const cells = Array.from(row.querySelectorAll('td'));
        if (cells.length > 0) {
          data.push(cells.map((td) => td.textContent?.trim() || ''));
        }
      }

      return data;
    }, args.selector, args.include_headers !== false);

    return {
      content: [{ type: 'text', text: JSON.stringify(tableData, null, 2) }],
    };
  }

  private async getCurrentPage(): Promise<Page> {
    if (!this.currentPage) {
      throw new Error('No browser is running. Please launch a browser first.');
    }
    return this.currentPage;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Web Automation MCP server running on stdio');
  }
}

const server = new WebAutomationServer();
server.run().catch(console.error);