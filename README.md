# code-snapshot-llm
This code will give you a code snapshot to input into an LLM.

## create_code_snapshot.js

I needed a simple solution for a small project I was working on to compare code outputs on various LLMs. 

**You can output your codebase into a file and then upload it to Grok, for example.**

-   Some LLMs cannot be integrated with Cursor or other IDEs directly so I needed to batch all my code files into a text file for its context. You make a text file with this code, and then upload it.
-   Also this could be repurposed if you have a lot of text files too or documentation.
-   If you want to **compare code outputs** across different LLMs. Helps evaluate which model understands your code better.
-   Automated documentation generation using an LLM.
-   **For a refactor or debugging task**, you can give an LLM a full snapshot of the codebase instead of manually copying files.

#### **Keep in Mind...**

This code was developed for a small project I am working on.

**It may not be suitable for large repos/codebases. Y**ou may need to modify it add concurrency and some other factors. ️**Also be careful--- depending on your configuration it could include all files, even .env files and secrets.** It's experimental, I have not tested it on all systems. **It *attempts* to use .gitignore, but there is no guarantee or warranty that it will, and in some cases it could fail to respect that.**

When using...

1.  **Since it could include additional private info** by accident, you must always manually check the output text file to make sure no private or secret info has been included. **It's your responsibility to do this if you use this code.** 
2.  **You should add your code snapshot text file to .gitignore.** For example if its code_snapshot.txt. That way if somehow you accidentally included a secret info file, it would not be checked into git inside the output file. **I also recommend using your own security scan** to check for PII/secret info in the file, especially big projects.
3.  **I always copy-paste a small substring** (ie. 5 characters) of a secret from.env.local and **do a "find" search in the code snapshot text file**, just to double-check, before I submit the text code snapshot to an LLM,

⚠️ **Use this code carefully, the output file could have sensitive info if you do not exclude it, or if there is an error. Never include files/directories with sensitive info, PII (private user info), company/private info, passwords or secret/API keys, etc. *You are responsible to double check output data****, it could include sensitive info in the codebase output file that you must manually check/remove. *

⚠️ It attempts to use the .gitignore file but it may fail for a variety of reasons, so you must validate that it is working as expected and no sensitive info is added. You should still add secret/private files to the isExcluded section earlier in the file, as an added precaution. There's no guarantee any of this works all the time, I've not tested it on a large-scale, so manually confirm its working as intended.

See https://opensource.org/license/mit

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.