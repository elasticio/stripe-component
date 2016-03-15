# stripe-component

> Stripe _component template_ for the [elastic.io platform](http://www.elastic.io "elastic.io platform")

This is an open source component template for [Stripe](https://stripe.com/) Online Payment System which is developed specifically to run on [elastic.io platform](http://www.elastic.io "elastic.io platform"). You can clone it and change it as you wish. However, **if you plan to deploy it into [elastic.io platform](http://www.elastic.io "elastic.io platform") you must follow sets of instructions to succseed**. 

> **PLEASE NOTE:** This is a working component for **Stripe**, however, it may not be suitable for every use case. Not all functionalities are included in this component template. **It is your responsibility to add and modify this component to suit your integration needs.** 

## Before you Begin

Before you can deploy any code into our system **you must be a registered elastic.io platform user**. Please see our home page at [http://www.elastic.io](http://www.elastic.io) to learn how. 

> Any attempt to deploy a code into our platform without a registration would fail.

After the registration and opening of the account you must **[upload your SSH Key](http://docs.elastic.io/docs/ssh-key)** into our platform. 

> If you fail to upload you SSH Key you will get **persmission denied** error during the deployment.

## Getting Started

After registration and uploading of your SSH Key you can proceed to deploy it into our system. At this stage we suggest you to:
* [Create a team](http://docs.elastic.io/docs/teams) to work on your new component. This is not required but will be automatically created using random naming by our system so we suggest you name your team accordingly.
* [Create a repository](http://docs.elastic.io/docs/component-repositories) where your new component is going to *reside* inside the team that you have just created. For a simplicity you can name your repository **stripe-component** or **stripe**.

```bash
$ git clone https://github.com/elasticio/stripe-component.git stripe-component

$ cd stripe-component
```
Now you can edit your version of **stripe-component** and change according to your needs - that is if you know what you are doing. Or you can just ``PUSH``it into our system to see the process in action:

```bash
$ git remote add elasticio your-created-team-name@git.elastic.io:stripe-component.git

$ git push elasticio master
```
Obviously the naming of your team and repository is entierly upto you and if you do not put any corresponding naming our system will auto generate it for you but the naming might not entierly correspond to your project requirements.
