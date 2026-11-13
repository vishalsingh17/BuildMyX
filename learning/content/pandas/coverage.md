---
title: Pandas topic coverage and sources
description: Every heading in the supplied pandas primer mapped to an original BuildMyX lesson, with current API notes and source credits.
course: Pandas
---

# Every pandas topic, easy to find

This index maps all **117 section/subsection headings** in the requested [Aman.ai pandas primer](https://aman.ai/primers/pandas/) to original lessons. The source outline was reviewed on **13 November 2026**. Repeated titles and nested selected-method recipes are included; their source fragments distinguish them.

The course uses new explanations, a synthetic workshop dataset, original examples and exercises. Source prose, screenshots and datasets are not reproduced. The heading snapshot, its HTML checksum and the local mapping are committed with the course so coverage can be checked during every build.

[Start the pandas path →](index.md){ .md-button .md-button--primary }

## Modern API notes

The examples target **pandas 3.1.1** and the pinned packages in the [setup instructions](getting-started.md#setup).

| Older wording or API | Current approach |
| --- | --- |
| “pandas is column-major” | Column-oriented operations without promising a universal memory layout; explicit C-contiguous NumPy conversion |
| `np.object` / `np.NaN` | `object` / `np.nan` and explicit nullable dtypes |
| `SettingWithCopyWarning` | Historical context, pandas 3 Copy-on-Write, single `.loc` assignment and `ChainedAssignmentError` diagnostics |
| `fillna(method="ffill")` | `.ffill()` with an explained missing-data policy |
| Assigning `.cat.categories` | `.cat.rename_categories(...)` and CategoricalDtype |
| Hour `H`, datetime month-end `M` | Current offset aliases such as `h` and `ME`; monthly Periods still use `M` |
| `DataFrame.to_frame()` | `to_frame()` is a **Series** method |
| `DataFrame.unique()` | **Series.unique()**, `pd.unique` on supported arrays, and DataFrame `drop_duplicates()` |
| DataFrame–Series broadcasting by size | Label alignment with an explicit row or column axis |
| `DataFrame.append` | `pd.concat`, with separate business-key validation |

## Reference heading → local lesson {#all-topics}

| Reference section | Read it here |
| --- | --- |
| [Overview](https://aman.ai/primers/pandas/#overview) | [Getting started](getting-started.md#overview) |
| [Background](https://aman.ai/primers/pandas/#background) | [Getting started](getting-started.md#prerequisites) |
| [Prerequisites](https://aman.ai/primers/pandas/#prerequisites) | [Getting started](getting-started.md#prerequisites) |
| [Setup](https://aman.ai/primers/pandas/#setup) | [Getting started](getting-started.md#setup) |
| [Overview: pandas data-structures](https://aman.ai/primers/pandas/#overview-pandas-data-structures) | [Getting started](getting-started.md#data-structures) |
| [Pandas is column-major](https://aman.ai/primers/pandas/#pandas-is-column-major) | [Dataframes](dataframes.md#column-oriented) |
| [Converting DataFrame to row-major order](https://aman.ai/primers/pandas/#converting-dataframe-to-row-major-order) | [Dataframes](dataframes.md#numpy-conversion) |
| [Series objects](https://aman.ai/primers/pandas/#series-objects) | [Series](series.md#creating) |
| [Creating a Series](https://aman.ai/primers/pandas/#creating-a-series) | [Series](series.md#creating) |
| [Similar to a 1D ndarray](https://aman.ai/primers/pandas/#similar-to-a-1d-ndarray) | [Series](series.md#array-operations) |
| [Index labels](https://aman.ai/primers/pandas/#index-labels) | [Series](series.md#labels) |
| [Initialize using a dict](https://aman.ai/primers/pandas/#initialize-using-a-dict) | [Series](series.md#constructors) |
| [Automatic alignment](https://aman.ai/primers/pandas/#automatic-alignment) | [Series](series.md#alignment) |
| [Initialize with a scalar](https://aman.ai/primers/pandas/#initialize-with-a-scalar) | [Series](series.md#constructors) |
| [Series name](https://aman.ai/primers/pandas/#series-name) | [Series](series.md#name-and-frame) |
| [Plotting a Series](https://aman.ai/primers/pandas/#plotting-a-series) | [Plotting](plotting.md#series-plot) |
| [Handling time](https://aman.ai/primers/pandas/#handling-time) | [Time series](time-series.md#ranges) |
| [Time range](https://aman.ai/primers/pandas/#time-range) | [Time series](time-series.md#ranges) |
| [Resampling](https://aman.ai/primers/pandas/#resampling) | [Time series](time-series.md#resampling) |
| [Upsampling and interpolation](https://aman.ai/primers/pandas/#upsampling-and-interpolation) | [Time series](time-series.md#upsampling) |
| [Timezones](https://aman.ai/primers/pandas/#timezones) | [Time series](time-series.md#timezones) |
| [Periods](https://aman.ai/primers/pandas/#periods) | [Time series](time-series.md#periods) |
| [DataFrame objects](https://aman.ai/primers/pandas/#dataframe-objects) | [Dataframes](dataframes.md#constructing) |
| [Creating a DataFrame](https://aman.ai/primers/pandas/#creating-a-dataframe) | [Dataframes](dataframes.md#constructing) |
| [Multi-indexing](https://aman.ai/primers/pandas/#multi-indexing) | [Reshaping](reshaping.md#multiindex) |
| [Dropping a level](https://aman.ai/primers/pandas/#dropping-a-level) | [Reshaping](reshaping.md#dropping-levels) |
| [Transposing](https://aman.ai/primers/pandas/#transposing) | [Reshaping](reshaping.md#transpose) |
| [Stacking and unstacking levels](https://aman.ai/primers/pandas/#stacking-and-unstacking-levels) | [Reshaping](reshaping.md#stack-unstack) |
| [Most pandas methods return modified copies](https://aman.ai/primers/pandas/#most-pandas-methods-return-modified-copies) | [Reliable workflows](reliable-workflows.md#returns) |
| [Accessing rows](https://aman.ai/primers/pandas/#accessing-rows) | [Indexing](indexing.md#iloc) |
| [Accessing columns](https://aman.ai/primers/pandas/#accessing-columns) | [Indexing](indexing.md#columns) |
| [Adding and removing columns](https://aman.ai/primers/pandas/#adding-and-removing-columns) | [Transforming](transforming.md#columns) |
| [Assigning new columns](https://aman.ai/primers/pandas/#assigning-new-columns) | [Transforming](transforming.md#assign) |
| [Evaluating an expression](https://aman.ai/primers/pandas/#evaluating-an-expression) | [Transforming](transforming.md#expressions) |
| [Querying a DataFrame](https://aman.ai/primers/pandas/#querying-a-dataframe) | [Transforming](transforming.md#expressions) |
| [Sorting a DataFrame](https://aman.ai/primers/pandas/#sorting-a-dataframe) | [Indexing](indexing.md#sorting) |
| [Plotting a DataFrame](https://aman.ai/primers/pandas/#plotting-a-dataframe) | [Plotting](plotting.md#dataframe-plot) |
| [Operations on DataFrames](https://aman.ai/primers/pandas/#operations-on-dataframes) | [Dataframes](dataframes.md#operations) |
| [Automatic alignment](https://aman.ai/primers/pandas/#automatic-alignment-1) | [Dataframes](dataframes.md#alignment) |
| [Handling missing data](https://aman.ai/primers/pandas/#handling-missing-data) | [Missing and exploration](missing-and-exploration.md#handling) |
| [Aggregating using groupby](https://aman.ai/primers/pandas/#aggregating-using-groupby) | [Groupby](groupby.md#groupby) |
| [Group DataFrame’s Rows into a List Using groupby](https://aman.ai/primers/pandas/#group-dataframes-rows-into-a-list-using-groupby) | [Groupby](groupby.md#lists) |
| [Get the N Largest Values for Each Category in a DataFrame](https://aman.ai/primers/pandas/#get-the-n-largest-values-for-each-category-in-a-dataframe) | [Groupby](groupby.md#top-n) |
| [Assign Name to a Pandas Aggregation](https://aman.ai/primers/pandas/#assign-name-to-a-pandas-aggregation) | [Groupby](groupby.md#named-aggregation) |
| [pd.pivot_table(): Turn Your DataFrame Into a Pivot Table](https://aman.ai/primers/pandas/#pdpivot_table-turn-your-dataframe-into-a-pivot-table) | [Reshaping](reshaping.md#pivot-table) |
| [Overview functions](https://aman.ai/primers/pandas/#overview-functions) | [Missing and exploration](missing-and-exploration.md#overview) |
| [Saving and loading](https://aman.ai/primers/pandas/#saving-and-loading) | [Input output](input-output.md#formats) |
| [Saving](https://aman.ai/primers/pandas/#saving) | [Input output](input-output.md#formats) |
| [Loading](https://aman.ai/primers/pandas/#loading) | [Input output](input-output.md#formats) |
| [Combining DataFrames](https://aman.ai/primers/pandas/#combining-dataframes) | [Combining](combining.md#joins) |
| [SQL-like joins](https://aman.ai/primers/pandas/#sql-like-joins) | [Combining](combining.md#joins) |
| [Concatenation](https://aman.ai/primers/pandas/#concatenation) | [Combining](combining.md#concat) |
| [Categories](https://aman.ai/primers/pandas/#categories) | [Accessors](accessors.md#categories) |
| [Practical example using a sample dataset](https://aman.ai/primers/pandas/#practical-example-using-a-sample-dataset) | [Getting started](getting-started.md#dataset) |
| [Dataset at a glance](https://aman.ai/primers/pandas/#dataset-at-a-glance) | [Getting started](getting-started.md#dataset) |
| [Iterating over rows](https://aman.ai/primers/pandas/#iterating-over-rows) | [Reliable workflows](reliable-workflows.md#iteration) |
| [.apply()](https://aman.ai/primers/pandas/#apply) | [Transforming](transforming.md#apply) |
| [.iterrows() and .itertuples()](https://aman.ai/primers/pandas/#iterrows-and-itertuples) | [Reliable workflows](reliable-workflows.md#iteration) |
| [Ordering slicing operations](https://aman.ai/primers/pandas/#ordering-slicing-operations) | [Indexing](indexing.md#operation-order) |
| [SettingWithCopyWarning](https://aman.ai/primers/pandas/#settingwithcopywarning) | [Reliable workflows](reliable-workflows.md#chained-assignment) |
| [View vs. Copy](https://aman.ai/primers/pandas/#view-vs-copy) | [Reliable workflows](reliable-workflows.md#copy-on-write) |
| [Solutions](https://aman.ai/primers/pandas/#solutions) | [Reliable workflows](reliable-workflows.md#single-loc) |
| [Combine all chained operations into one single operation](https://aman.ai/primers/pandas/#combine-all-chained-operations-into-one-single-operation) | [Reliable workflows](reliable-workflows.md#single-loc) |
| [Raise an error](https://aman.ai/primers/pandas/#raise-an-error) | [Reliable workflows](reliable-workflows.md#raise-error) |
| [Indexing and slicing](https://aman.ai/primers/pandas/#indexing-and-slicing) | [Indexing](indexing.md#iloc) |
| [.iloc[]: selecting rows based on integer indices](https://aman.ai/primers/pandas/#iloc-selecting-rows-based-on-integer-indices) | [Indexing](indexing.md#iloc) |
| [.loc[]: selecting rows by labels or boolean masks](https://aman.ai/primers/pandas/#loc-selecting-rows-by-labels-or-boolean-masks) | [Indexing](indexing.md#loc-labels) |
| [Selecting rows by boolean masks](https://aman.ai/primers/pandas/#selecting-rows-by-boolean-masks) | [Indexing](indexing.md#masks) |
| [Selecting rows by labels](https://aman.ai/primers/pandas/#selecting-rows-by-labels) | [Indexing](indexing.md#loc-labels) |
| [Creating labels](https://aman.ai/primers/pandas/#creating-labels) | [Indexing](indexing.md#loc-labels) |
| [Selecting rows by labels](https://aman.ai/primers/pandas/#selecting-rows-by-labels-1) | [Indexing](indexing.md#loc-labels) |
| [Slicing Series](https://aman.ai/primers/pandas/#slicing-series) | [Indexing](indexing.md#series-slices) |
| [Accessors](https://aman.ai/primers/pandas/#accessors) | [Accessors](accessors.md#accessors) |
| [string accessor](https://aman.ai/primers/pandas/#string-accessor) | [Accessors](accessors.md#strings) |
| [Other accessors](https://aman.ai/primers/pandas/#other-accessors) | [Accessors](accessors.md#accessors) |
| [Data exploration](https://aman.ai/primers/pandas/#data-exploration) | [Missing and exploration](missing-and-exploration.md#overview) |
| [.head(), .tail(), .describe(), .info()](https://aman.ai/primers/pandas/#head-tail-describe-info) | [Missing and exploration](missing-and-exploration.md#overview) |
| [Count unique values](https://aman.ai/primers/pandas/#count-unique-values) | [Missing and exploration](missing-and-exploration.md#uniqueness) |
| [Plotting](https://aman.ai/primers/pandas/#plotting) | [Plotting](plotting.md#grouped-plot) |
| [Common pitfalls](https://aman.ai/primers/pandas/#common-pitfalls) | [Reliable workflows](reliable-workflows.md#copy-on-write) |
| [NaNs as floats](https://aman.ai/primers/pandas/#nans-as-floats) | [Missing and exploration](missing-and-exploration.md#sentinels) |
| [Changes aren’t in-place by default](https://aman.ai/primers/pandas/#changes-arent-in-place-by-default) | [Reliable workflows](reliable-workflows.md#returns) |
| [Reproducibility issues](https://aman.ai/primers/pandas/#reproducibility-issues) | [Reliable workflows](reliable-workflows.md#reproducibility) |
| [GPU incompatibility](https://aman.ai/primers/pandas/#gpu-incompatibility) | [Reliable workflows](reliable-workflows.md#gpu) |
| [Selected Methods](https://aman.ai/primers/pandas/#selected-methods) | [Coverage](coverage.md#recipes) |
| [Creating a DataFrame](https://aman.ai/primers/pandas/#creating-a-dataframe-1) | [Dataframes](dataframes.md#constructing) |
| [Fix Unnamed:0 When Reading a CSV in pandas](https://aman.ai/primers/pandas/#fix-unnamed0-when-reading-a-csv-in-pandas) | [Input output](input-output.md#unnamed-index) |
| [Read HTML Tables Using Pandas](https://aman.ai/primers/pandas/#read-html-tables-using-pandas) | [Input output](input-output.md#html) |
| [pd.read_clipboard(): Copy CSV directly into a DataFrame](https://aman.ai/primers/pandas/#pdread_clipboard-copy-csv-directly-into-a-dataframe) | [Input output](input-output.md#clipboard) |
| [DataFrame.copy(): Make a Copy of a DataFrame](https://aman.ai/primers/pandas/#dataframecopy-make-a-copy-of-a-dataframe) | [Reliable workflows](reliable-workflows.md#copy) |
| [DataFrame.Series.str.split: Split a String into Multiple Rows](https://aman.ai/primers/pandas/#dataframeseriesstrsplit-split-a-string-into-multiple-rows) | [Transforming](transforming.md#split-explode) |
| [Transforming/Modifying a DataFrame](https://aman.ai/primers/pandas/#transformingmodifying-a-dataframe) | [Transforming](transforming.md#columns) |
| [Series.map(): Change Values of a Pandas Series Using a Dictionary](https://aman.ai/primers/pandas/#seriesmap-change-values-of-a-pandas-series-using-a-dictionary) | [Transforming](transforming.md#map) |
| [DataFrame.to_frame(): Convert Series to DataFrame](https://aman.ai/primers/pandas/#dataframeto_frame-convert-series-to-dataframe) | [Series](series.md#name-and-frame) |
| [DataFrame.values: Return a NumPy representation of the DataFrame](https://aman.ai/primers/pandas/#dataframevalues-return-a-numpy-representation-of-the-dataframe) | [Dataframes](dataframes.md#numpy-conversion) |
| [DataFrame.apply(): Apply a Function to a Column of a DataFrame](https://aman.ai/primers/pandas/#dataframeapply-apply-a-function-to-a-column-of-a-dataframe) | [Transforming](transforming.md#apply) |
| [DataFrame.assign(): Assign Values to Multiple New Columns](https://aman.ai/primers/pandas/#dataframeassign-assign-values-to-multiple-new-columns) | [Transforming](transforming.md#assign) |
| [Chaining multiple assigns](https://aman.ai/primers/pandas/#chaining-multiple-assigns) | [Transforming](transforming.md#assign) |
| [DataFrame.groupby(): Group DataFrame using a mapper or by a Series of columns](https://aman.ai/primers/pandas/#dataframegroupby-group-dataframe-using-a-mapper-or-by-a-series-of-columns) | [Groupby](groupby.md#levels-mappers) |
| [DataFrame.groupby.sample(): Get a Random Sample of Items from Each Category in a Column](https://aman.ai/primers/pandas/#dataframegroupbysample-get-a-random-sample-of-items-from-each-category-in-a-column) | [Groupby](groupby.md#sample) |
| [DataFrame.groupby().size() / DataFrame.groupby().count(): Compute the Size of Each Group](https://aman.ai/primers/pandas/#dataframegroupbysize--dataframegroupbycount-compute-the-size-of-each-group) | [Groupby](groupby.md#size-count) |
| [DataFrame.explode(): Transform Each Element in an Iterable to a Row](https://aman.ai/primers/pandas/#dataframeexplode-transform-each-element-in-an-iterable-to-a-row) | [Transforming](transforming.md#split-explode) |
| [DataFrame.fillna(method="ffill"): Forward Fill in pandas](https://aman.ai/primers/pandas/#dataframefillnamethodffill-forward-fill-in-pandas) | [Missing and exploration](missing-and-exploration.md#forward-fill) |
| [pd.melt(): Unpivot a DataFrame](https://aman.ai/primers/pandas/#pdmelt-unpivot-a-dataframe) | [Reshaping](reshaping.md#melt) |
| [pd.crosstab(): Create a Cross Tabulation](https://aman.ai/primers/pandas/#pdcrosstab-create-a-cross-tabulation) | [Reshaping](reshaping.md#crosstab) |
| [pd.DataFrame.agg(): Aggregate over Columns or Rows Using Multiple Operations](https://aman.ai/primers/pandas/#pddataframeagg-aggregate-over-columns-or-rows-using-multiple-operations) | [Groupby](groupby.md#agg) |
| [pd.DataFrame.agg(): Apply Different Aggregations to Different Columns](https://aman.ai/primers/pandas/#pddataframeagg-apply-different-aggregations-to-different-columns) | [Groupby](groupby.md#agg) |
| [Analyzing a DataFrame](https://aman.ai/primers/pandas/#analyzing-a-dataframe) | [Missing and exploration](missing-and-exploration.md#overview) |
| [DataFrame.any(): Return whether any element is True, potentially over an axis.](https://aman.ai/primers/pandas/#dataframeany-return-whether-any-element-is-true-potentially-over-an-axis) | [Missing and exploration](missing-and-exploration.md#any-all) |
| [Series](https://aman.ai/primers/pandas/#series) | [Missing and exploration](missing-and-exploration.md#any-all) |
| [DataFrame](https://aman.ai/primers/pandas/#dataframe) | [Missing and exploration](missing-and-exploration.md#any-all) |
| [DataFrame.isna(): Detect missing values](https://aman.ai/primers/pandas/#dataframeisna-detect-missing-values) | [Missing and exploration](missing-and-exploration.md#sentinels) |
| [DataFrame.value_counts(): Return a Series containing counts of unique values](https://aman.ai/primers/pandas/#dataframevalue_counts-return-a-series-containing-counts-of-unique-values) | [Missing and exploration](missing-and-exploration.md#uniqueness) |
| [DataFrame.unique(): Return unique values based on a hash table](https://aman.ai/primers/pandas/#dataframeunique-return-unique-values-based-on-a-hash-table) | [Missing and exploration](missing-and-exploration.md#uniqueness) |
| [What’s next?](https://aman.ai/primers/pandas/#whats-next) | [Project](project.md#next) |
| [References and Credits](https://aman.ai/primers/pandas/#references-and-credits) | [Coverage](coverage.md#sources) |
| [Citation](https://aman.ai/primers/pandas/#citation) | [Coverage](coverage.md#sources) |

## Selected methods by task {#recipes}

- **Construct:** [DataFrames and masked arrays](dataframes.md#constructing), [Series.to_frame](series.md#name-and-frame), [NumPy conversion](dataframes.md#numpy-conversion).
- **Transform:** [map and apply](transforming.md#map), [assign](transforming.md#assign), [split and explode](transforming.md#split-explode), [forward fill](missing-and-exploration.md#forward-fill).
- **Summarize:** [named aggregates](groupby.md#named-aggregation), [lists](groupby.md#lists), [top N](groupby.md#top-n), [sampling](groupby.md#sample), [size versus count](groupby.md#size-count), [row/column agg](groupby.md#agg).
- **Reshape:** [pivot tables](reshaping.md#pivot-table), [melt](reshaping.md#melt), [crosstab](reshaping.md#crosstab).
- **Read and save:** [CSV index cleanup](input-output.md#unnamed-index), [HTML](input-output.md#html), [Excel](input-output.md#excel), [clipboard](input-output.md#clipboard), [JSON and dictionaries](input-output.md#json).
- **Inspect:** [missing data](missing-and-exploration.md#sentinels), [counts and unique values](missing-and-exploration.md#uniqueness), [any and all](missing-and-exploration.md#any-all).
- **Work reliably:** [copy semantics](reliable-workflows.md#copy), [assignment](reliable-workflows.md#single-loc), [iteration](reliable-workflows.md#iteration), [reproducibility](reliable-workflows.md#reproducibility).

## Sources and attribution {#sources}

- Aman Chadha, **Pandas Tutorial**, Distilled AI / Aman.ai: [the supplied reference primer](https://aman.ai/primers/pandas/). This independent course uses its topic outline as the coverage checklist. The primer also credits Aurélien Géron's pandas notebook and Chip Huyen's practical pandas material, among other sources.
- [Official pandas documentation](https://pandas.pydata.org/docs/), especially [Copy-on-Write](https://pandas.pydata.org/docs/user_guide/copy_on_write.html), [time series](https://pandas.pydata.org/docs/user_guide/timeseries.html), [I/O tools](https://pandas.pydata.org/docs/user_guide/io.html) and the [API reference](https://pandas.pydata.org/docs/reference/index.html), for current behavior.
- [NumPy documentation](https://numpy.org/doc/stable/) for arrays and memory order, and [matplotlib documentation](https://matplotlib.org/stable/) for plotting.

To cite the source primer: Aman Chadha, “Pandas Tutorial,” Distilled AI (2020), https://aman.ai/primers/pandas/, accessed 13 November 2026. To cite this course, identify BuildMyX Learn and the page used. These are separate works; no affiliation or endorsement is implied.
