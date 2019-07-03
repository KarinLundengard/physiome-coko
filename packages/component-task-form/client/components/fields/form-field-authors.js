import React, {Fragment, useEffect} from 'react';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { nextUniqueIdInArray, assignUniqueIdsToArrayItems } from '../../utils/helpers';
import styled from 'styled-components';
import { th } from 'ds-awards-theme';

import withFormField from "./withFormField";
import { useFormValueBindingForComplexObject } from '../../hooks/useFormValueBinding';

import Label, { BlockLabel } from "ds-awards-theme/components/label";
import InlineButton from "ds-awards-theme/components/inline-button";
import { DisabledStaticText } from 'ds-awards-theme/components/static-text';
import ValidationIssueListing from 'ds-awards-theme/components/validation-issue-listing';
import { FaPlus } from 'react-icons/fa';


import AuthorEditorCard from "../author-editor-card";
import useFormValidation from "../../hooks/useFormValidation";

import { registerConditionFunction } from 'client-workflow-model/Condition';



registerConditionFunction('correspondingAuthors', v => {
    if(!v || !v.length) {
        return 0;
    }
    return v.filter(a => a.isCorresponding === true).length;
});



const AuthorsEditorHolder = styled.div`    
    > div.inner-holder {
        border: 1px solid #d0d0d0;
        border-radius: 5px;
        padding: 5px;
    }
    
    /*min-width: 750px;*/
`;

const AuthorEditorCardHolder = styled.div`

    border: 1px solid #d0d0d0;
    padding: 8px;
    border-radius: 5px;
    
    & .drag-author {
        margin: 10px 10px 20px;
    }
    
    & .drag-author:focus {
        border-radius: 5px;
        box-shadow: 0 0 2px 2px #2196F3;
        border-color: #2196F3;
        outline: 0;
    }
    
    & .drag-author:focus > ${AuthorEditorCard} {
        border-color: #2196F3;
    }
    
    &.issues {
      box-shadow: inset 0 0 6px #d10f008c;
      border-color: #d10f00;
    }
`;

const DraggableAuthorCard = ({authorId, index, ...props}) => {

    return (
        <Draggable draggableId={authorId} key={authorId} data-id={authorId} index={index}>
            {(provided, snapshot)=>
                <div className="drag-author" ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                    <AuthorEditorCard {...props} />
                </div>
            }
        </Draggable>
    )
};


function FormFieldAuthorsEditor({ className, data, binding, description, formDefinition, formValidator, options = {} }) {

    const [authors, setAuthors] = useFormValueBindingForComplexObject(data, binding);
    const [validationIssues, clearValidationIssues] = useFormValidation(description, formDefinition, formValidator);


    // Make sure all authors have a unique id associated.
    useEffect(() => {
        if(!authors || !authors.length) {
            return;
        }
        assignUniqueIdsToArrayItems(authors);
    }, [authors]);

    const addAuthor = () => {

        const newAuthor = {id:nextUniqueIdInArray(authors)};
        const newAuthorsList = (authors || []).splice(0);

        clearValidationIssues();
        newAuthorsList.push(newAuthor);
        setAuthors(newAuthorsList);
    };

    const removeAuthor = a => {
        clearValidationIssues();

        const id = a.id;
        setAuthors(authors.splice(0).filter(a => a.id !== id));
    };

    const didModifyAuthor = (author) => {
        clearValidationIssues();
        setAuthors(authors);
    };

    const onDragEnd = ({destination, source}) => {

        if(!destination) {
            return;
        }

        const newAuthorListing = Array.from(authors);
        const [movedAuthor] = newAuthorListing.splice(source.index, 1);

        newAuthorListing.splice(destination.index, 0, movedAuthor);
        setAuthors(newAuthorListing);
    };


    return (
        <AuthorsEditorHolder className={className}>
            {options.label ? <Label>{options.label}</Label> : null}

            <AuthorEditorCardHolder className={validationIssues && validationIssues.length ? 'issues' : ''}>

                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="author-listing">
                        {(provided, snapshot) => (
                            <div ref={provided.innerRef}>

                                {(authors || []).map((author, index) => {
                                    return (
                                        <DraggableAuthorCard key={author.id} authorId={author.id} index={index} author={author}
                                            formValidator={formValidator} didModifyAuthor={didModifyAuthor} removeAuthor={removeAuthor} />
                                    );
                                })}

                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>

                <div style={{"padding": "8px"}}>
                    <InlineButton icon={<FaPlus />} bordered={true} onClick={addAuthor}>Add Author</InlineButton>
                </div>

            </AuthorEditorCardHolder>

            { validationIssues ? <ValidationIssueListing issues={validationIssues} /> : null }

        </AuthorsEditorHolder>
    );
}


export default withFormField(FormFieldAuthorsEditor);


// ----
// Authors (static list)
// ---

const AuthorRow = styled.li`
  > div {
    margin-left: 24px;
    font-size: 95%;
    color: #505050;
  }
  
  > ul {
    font-size: 95%;
  }
`;

const AuthorListing = styled( ({className, authors}) => {
    return (
        <ol className={className}>
            {authors.map((author, index) => {

                const affiliations = author.affiliations ? author.affiliations.filter(a => a.organization && a.organization.name) : null;

                return (
                    <AuthorRow key={index}>
                        {index + 1}. {author.name} ({author.email})
                        { affiliations ?
                            <Fragment>
                                <div>Affiliations:</div>
                                <ul>
                                    {affiliations.map((a, i) => <li key={i}>{a.organization.name}{a.department ? <span>, {a.department}</span> : null}</li>)}
                                </ul>
                            </Fragment>
                            : null
                        }
                    </AuthorRow>
                );
            } )}
        </ol>
    );
})`
  
  list-style: none;
  margin: 0;
  padding: 0;
  font-family: ${th('authorListing.fontFamily')};
  font-size: ${th('authorListing.fontSize')};
  
  & > li + li {
    margin-top: 5px;
  }

`;

function _FormFieldAuthorsListing({ className, data, binding, instanceId, instanceType, options = {} }) {

    const [authors] = useFormValueBindingForComplexObject(data, binding);

    return (
        <div className={className}>
            {options.label ? <BlockLabel>{options.label}</BlockLabel> : null}
            {(authors && authors instanceof Array && authors.length) ?
                <AuthorListing authors={authors} /> : <DisabledStaticText>No Authors were specified</DisabledStaticText>
            }
        </div>
    );
}

const FormFieldAuthorsListing = withFormField(_FormFieldAuthorsListing);



export { FormFieldAuthorsListing };